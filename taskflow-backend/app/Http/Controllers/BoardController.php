<?php

namespace App\Http\Controllers;

use App\Models\Board;
use App\Models\Team;
use App\Models\BoardColumn;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;

class BoardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $boards = Board::forUser($request->user()->id)
                      ->with(['team', 'createdBy', 'columns.tasks'])
                      ->withCount(['tasks'])
                      ->get();

        return response()->json([
            'success' => true,
            'data' => $boards
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'team_id' => 'required|exists:teams,id',
        ]);

        $team = Team::findOrFail($validated['team_id']);
        Gate::authorize('manage', $team);

        DB::beginTransaction();
        try {
            $board = Board::create([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'team_id' => $validated['team_id'],
                'created_by' => $request->user()->id,
            ]);

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

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $board->load(['team', 'createdBy', 'columns'])
            ], 201);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create board'
            ], 500);
        }
    }

    public function show(Board $board): JsonResponse
    {
        Gate::authorize('view', $board);

        return response()->json([
            'success' => true,
            'data' => $board->load(['team', 'createdBy', 'columns.tasks.assignee', 'columns.tasks.comments'])
        ]);
    }

    public function update(Request $request, Board $board): JsonResponse
    {
        Gate::authorize('update', $board);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $board->update($validated);

        return response()->json([
            'success' => true,
            'data' => $board->fresh(['team', 'createdBy', 'columns'])
        ]);
    }

    public function destroy(Board $board): JsonResponse
    {
        Gate::authorize('delete', $board);

        $board->delete();

        return response()->json([
            'success' => true,
            'message' => 'Board deleted successfully'
        ]);
    }

    public function byTeam(Team $team): JsonResponse
    {
        Gate::authorize('view', $team);

        $boards = $team->boards()
                      ->with(['createdBy', 'columns'])
                      ->withCount(['tasks'])
                      ->get();

        return response()->json([
            'success' => true,
            'data' => $boards
        ]);
    }
}
