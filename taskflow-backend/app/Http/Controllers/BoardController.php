<?php

namespace App\Http\Controllers;

use App\Models\Board;
use App\Models\Team;
use App\Models\BoardColumn;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\EventsController;
use Illuminate\Support\Facades\Auth;

class BoardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $type = $request->get('type', 'active'); // active, archived, deleted, recent
            $limit = $request->get('limit');
            
            
            Log::info('Fetching boards for user', [
                'user_id' => $user->id, 
                'type' => $type,
                'limit' => $limit
            ]);
            
            $query = Board::forUser($user->id)
                ->with(['createdBy', 'team', 'columns'])
                ->withCount(['tasks']);

            switch ($type) {
                case 'recent':
                    $query = $query->active()->recentlyVisited($limit ?: 5);
                    break;
                case 'archived':
                    $query = $query->archived()->orderBy('archived_at', 'desc');
                    break;
                case 'deleted':
                    $query = $query->onlyTrashed()->orderBy('deleted_at', 'desc');
                    break;
                case 'active':
                default:
                    $query = $query->active()->orderBy('created_at', 'desc');
                    break;
            }

            if ($limit && $type !== 'recent') {
                $query = $query->limit($limit);
            }
            
            $boards = $query->get();
            
            Log::info('Boards fetched successfully', [
                'count' => $boards->count(),
                'type' => $type
            ]);
            
            return response()->json([
                'success' => true,
                'data' => $boards
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching boards', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch boards: ' . $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string|max:1000',
                'team_id' => 'nullable|exists:teams,id',
                'columns' => 'sometimes|array',
            ]);

            // Check team access if team_id is provided
            if (!empty($validated['team_id'])) {
                $team = Team::findOrFail($validated['team_id']);
                Gate::authorize('view', $team);
            }

            DB::beginTransaction();
            Log::info('Creating board', ['data' => $validated, 'user_id' => $request->user()->id]);
            
            $board = Board::create([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'team_id' => $validated['team_id'] ?? null,
                'created_by' => $request->user()->id,
                'last_visited_at' => now(), // Set initial visit time
            ]);

            $board->append('completion_percentage');

            // Create columns (either from request or defaults)
            if (isset($validated['columns']) && !empty($validated['columns'])) {
                // Use columns from request
                foreach ($validated['columns'] as $index => $column) {
                    BoardColumn::create([
                        'board_id' => $board->id,
                        'name' => $column['title'] ?? $column['name'] ?? 'Untitled Column',
                        'position' => $index,
                        'color' => $column['color'] ?? null,
                    ]);
                }
            } else {
                // Create default columns
                $defaultColumns = [
                    ['name' => 'To Do', 'position' => 0, 'color' => '#ef4444'],
                    ['name' => 'In Progress', 'position' => 1, 'color' => '#f59e0b'],
                    ['name' => 'Review', 'position' => 2, 'color' => '#3b82f6'],
                    ['name' => 'Done', 'position' => 3, 'color' => '#10b981'],
                ];
                
                foreach ($defaultColumns as $column) {
                    BoardColumn::create([
                        'board_id' => $board->id,
                        'name' => $column['name'],
                        'position' => $column['position'],
                        'color' => $column['color'],
                    ]);
                }
            }

            DB::commit();
            
            // Load the board with all relationships
            $board = $board->fresh(['team', 'createdBy', 'columns']);
            Log::info('Board created successfully', ['board_id' => $board->id]);
            
            return response()->json([
                'success' => true,
                'data' => $board
            ], 201);
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Error creating board', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create board: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show(Board $board, Request $request): JsonResponse
    {
        try {
            Gate::authorize('view', $board);
            
            // Update last visited timestamp
            $board->updateLastVisited();
            
            Log::info('Loading board with relationships', ['board_id' => $board->id]);
            
            // Load relationships step by step to debug
            $board->load([
                'team', 
                'createdBy', 
                'columns' => function ($query) {
                    $query->orderBy('position');
                }
            ]);
            
            // Load tasks separately to avoid the relationship issue
            foreach ($board->columns as $column) {
                $column->load([
                    'tasks' => function ($query) {
                        $query->orderBy('position');
                    },
                    'tasks.assignee',
                    'tasks.comments' => function ($query) {
                        $query->latest()->limit(5);
                    }
                ]);
            }
            
            // Compute effective permissions for the current user (backend source of truth)
            $user = $request->user();
            $permissions = [
                'effective_role'   => $board->getUserRole($user),
                'user_role'        => $board->getUserRole($user), // alias
                'can_view_board'   => $board->canUserAccess($user),
                'can_edit_tasks'   => $board->canUserEditTasks($user),
                'can_create_tasks' => $board->canUserCreateTasks($user),
                'can_delete_tasks' => $board->canUserEditTasks($user), // same as edit for now
                'can_manage_board' => $board->canUserManage($user),
                'is_viewer'        => $board->isUserViewer($user),
            ];

            Log::info('Board loaded successfully', ['board_id' => $board->id]);
            
            return response()->json([
                'success' => true,
                'data' => array_merge($board->toArray(), [
                    'permissions' => $permissions,
                ])
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching board', [
                'board_id' => $board->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch board: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, Board $board): JsonResponse
    {
        try {
            Gate::authorize('update', $board);
            
            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'description' => 'nullable|string|max:1000',
            ]);
            
            Log::info('Updating board', ['board_id' => $board->id, 'data' => $validated]);
            $board->update($validated);
            Log::info('Board updated successfully', ['board_id' => $board->id]);
            
            return response()->json([
                'success' => true,
                'data' => $board->fresh(['team', 'createdBy', 'columns'])
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating board', [
                'board_id' => $board->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update board: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Board $board): JsonResponse
    {
        try {
            Gate::authorize('delete', $board);
            
            Log::info('Deleting board', ['board_id' => $board->id]);
            $board->delete(); // This will soft delete
            Log::info('Board deleted successfully', ['board_id' => $board->id]);
            // Emit SSE to update dashboards and lists
            try {
                EventsController::queueEvent('board.deleted', [
                    'boardId' => $board->id,
                    'userId' => Auth::id(),
                    'timestamp' => now()->toISOString(),
                ]);
            } catch (\Throwable $e) {}
            
            return response()->json([
                'success' => true,
                'message' => 'Board deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting board', [
                'board_id' => $board->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete board: ' . $e->getMessage()
            ], 500);
        }
    }

    public function archive(Board $board): JsonResponse
    {
        try {
            Gate::authorize('update', $board);
            
            Log::info('Archiving board', ['board_id' => $board->id]);
            $board->archive();
            Log::info('Board archived successfully', ['board_id' => $board->id]);
            // Emit SSE to update dashboards and lists
            try {
                EventsController::queueEvent('board.archived', [
                    'boardId' => $board->id,
                    'userId' => Auth::id(),
                    'timestamp' => now()->toISOString(),
                ]);
            } catch (\Throwable $e) {}
            
            return response()->json([
                'success' => true,
                'message' => 'Board archived successfully',
                'data' => $board->fresh(['team', 'createdBy', 'columns'])
            ]);
        } catch (\Exception $e) {
            Log::error('Error archiving board', [
                'board_id' => $board->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to archive board: ' . $e->getMessage()
            ], 500);
        }
    }

    public function unarchive(Board $board): JsonResponse
    {
        try {
            Gate::authorize('update', $board);
            
            Log::info('Unarchiving board', ['board_id' => $board->id]);
            $board->unarchive();
            Log::info('Board unarchived successfully', ['board_id' => $board->id]);
            // Emit SSE to update dashboards and lists
            try {
                EventsController::queueEvent('board.unarchived', [
                    'boardId' => $board->id,
                    'userId' => Auth::id(),
                    'timestamp' => now()->toISOString(),
                ]);
            } catch (\Throwable $e) {}
            
            return response()->json([
                'success' => true,
                'message' => 'Board unarchived successfully',
                'data' => $board->fresh(['team', 'createdBy', 'columns'])
            ]);
        } catch (\Exception $e) {
            Log::error('Error unarchiving board', [
                'board_id' => $board->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to unarchive board: ' . $e->getMessage()
            ], 500);
        }
    }

    public function restore(Request $request, $id): JsonResponse
    {
        try {
            $board = Board::withTrashed()->findOrFail($id);
            Gate::authorize('update', $board);
            
            Log::info('Restoring board', ['board_id' => $board->id]);
            $board->restore();
            Log::info('Board restored successfully', ['board_id' => $board->id]);
            // Emit SSE to update dashboards and lists
            try {
                EventsController::queueEvent('board.restored', [
                    'boardId' => $board->id,
                    'userId' => Auth::id(),
                    'timestamp' => now()->toISOString(),
                ]);
            } catch (\Throwable $e) {}
            
            return response()->json([
                'success' => true,
                'message' => 'Board restored successfully',
                'data' => $board->fresh(['team', 'createdBy', 'columns'])
            ]);
        } catch (\Exception $e) {
            Log::error('Error restoring board', [
                'board_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to restore board: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function byTeam(Team $team): JsonResponse
    {
        try {
            Gate::authorize('view', $team);
            Log::info('Fetching boards by team', ['team_id' => $team->id]);
            
            $boards = $team->boards()
                ->with(['createdBy', 'columns'])
                ->withCount(['tasks'])
                ->get();
                
            Log::info('Team boards fetched successfully', [
                'team_id' => $team->id, 
                'board_count' => $boards->count()
            ]);
                
            return response()->json([
                'success' => true,
                'data' => $boards
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching team boards', [
                'team_id' => $team->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch team boards: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get teams that have access to a board
     */
    public function getTeams(Request $request, Board $board): JsonResponse
    {
        try {
            Gate::authorize('view', $board);
            
            // If board has a team, return that team
            $teams = [];
            if ($board->team) {
                $teams = [$board->team->load('owner', 'members')];
            }
            
            Log::info('Board teams fetched', [
                'board_id' => $board->id,
                'teams_count' => count($teams)
            ]);
            
            return response()->json([
                'success' => true,
                'data' => $teams
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching board teams', [
                'board_id' => $board->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch board teams: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add a team to a board
     */
    public function addTeam(Request $request, Board $board, Team $team): JsonResponse
    {
        try {
            Gate::authorize('update', $board);
            Gate::authorize('view', $team);
            
            // Check if the board already belongs to the team
            if ($board->team_id === $team->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Board already belongs to this team'
                ], 400);
            }
            
            // Update the board's team
            $board->update(['team_id' => $team->id]);
            
            Log::info('Team added to board', [
                'board_id' => $board->id,
                'team_id' => $team->id,
                'user_id' => $request->user()->id
            ]);
            
            return response()->json([
                'success' => true,
                'data' => $board->fresh(['team', 'createdBy']),
                'message' => 'Team added to board successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error adding team to board', [
                'board_id' => $board->id,
                'team_id' => $team->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to add team to board: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove a team from a board
     */
    public function removeTeam(Request $request, Board $board, Team $team): JsonResponse
    {
        try {
            Gate::authorize('update', $board);
            
            // Check if the board belongs to this team
            if ($board->team_id !== $team->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Board does not belong to this team'
                ], 400);
            }
            
            // Remove the team from the board (make it personal)
            $board->update(['team_id' => null]);
            
            Log::info('Team removed from board', [
                'board_id' => $board->id,
                'team_id' => $team->id,
                'user_id' => $request->user()->id
            ]);
            
            return response()->json([
                'success' => true,
                'data' => $board->fresh(['team', 'createdBy']),
                'message' => 'Team removed from board successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error removing team from board', [
                'board_id' => $board->id,
                'team_id' => $team->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove team from board: ' . $e->getMessage()
            ], 500);
        }
    }
}
