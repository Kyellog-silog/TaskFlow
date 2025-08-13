<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Board;
use App\Models\BoardColumn;
use App\Models\TaskActivity;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class TaskController extends Controller
{
    /**
     * List tasks with optional filtering.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            Log::info('Fetching tasks', ['user_id' => $user->id, 'filters' => $request->all()]);
            
            $query = Task::with(['assignee', 'createdBy', 'comments.user', 'board', 'column']);

            // Filter by board
            if ($request->has('board_id')) {
                $board = Board::findOrFail($request->board_id);
                Gate::authorize('view', $board);
                $query->byBoard($request->board_id);
            } else {
                // Only show tasks from boards the user can access
                $query->whereHas('board', function ($q) use ($user) {
                    $q->forUser($user->id);
                });
            }

            // Filter by column
            if ($request->has('column_id')) {
                $query->byColumn($request->column_id);
            }

            // Filter by assignee
            if ($request->has('assignee_id')) {
                $query->byAssignee($request->assignee_id);
            }

            // Filter by priority
            if ($request->has('priority')) {
                $query->byPriority($request->priority);
            }

            // Search by title
            if ($request->has('search')) {
                $query->where('title', 'like', '%' . $request->search . '%');
            }

            // Filter by status
            if ($request->has('status')) {
                $query->where('column_id', $request->status);
            }

            // Limit results
            if ($request->has('limit')) {
                $query->limit($request->limit);
            }

            $tasks = $query->orderBy('position')->get();
            
            Log::info('Tasks fetched successfully', ['count' => $tasks->count()]);
            
            return response()->json([
                'success' => true,
                'data' => $tasks
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching tasks', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch tasks: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new task.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            Log::info('Creating task with request data:', $request->all());
            
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'board_id' => 'required|exists:boards,id',
                'column_id' => 'required|exists:board_columns,id',
                'assignee_id' => 'nullable|exists:users,id',
                'priority' => 'nullable|in:low,medium,high',
                'due_date' => 'nullable|date',
            ]);
            
            Log::info('Validated task data:', $validated);

            // Check if user can create tasks on the board
            $board = Board::findOrFail($validated['board_id']);
            Gate::authorize('createTasks', $board);

            // Verify the column belongs to the board
            $column = BoardColumn::where('id', $validated['column_id'])
                ->where('board_id', $validated['board_id'])
                ->firstOrFail();

            // Get the position for the new task
            $position = Task::where('column_id', $validated['column_id'])->count();

            DB::beginTransaction();
            
            $task = Task::create([
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'board_id' => $validated['board_id'],
                'column_id' => $validated['column_id'],
                'assignee_id' => $validated['assignee_id'] ?? null,
                'created_by' => $request->user()->id,
                'priority' => $validated['priority'] ?? 'medium',
                'due_date' => $validated['due_date'] ?? null,
                'position' => $position,
            ]);

            // Log activity
            TaskActivity::create([
                'task_id' => $task->id,
                'user_id' => $request->user()->id,
                'action' => 'created',
                'description' => 'Task created'
            ]);

            DB::commit();

            // Load the task with relationships
            $task = $task->fresh(['assignee', 'createdBy', 'comments.user', 'board', 'column']);
            Log::info('Task created successfully', ['task_id' => $task->id]);
            
            return response()->json([
                'success' => true,
                'data' => $task
            ], 201);
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Error creating task', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create task: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific task with its relationships.
     */
    public function show(Task $task): JsonResponse
    {
        try {
            Gate::authorize('view', $task->board);
            Log::info('Fetching task details', ['task_id' => $task->id]);
            
            $task->load([
                'assignee', 
                'createdBy', 
                'comments.user', 
                'activities.user', 
                'board', 
                'column',
                'attachments'
            ]);
            
            Log::info('Task fetched successfully', ['task_id' => $task->id]);
            
            return response()->json([
                'success' => true,
                'data' => $task
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching task', [
                'task_id' => $task->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch task: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a task.
     */
    public function update(Request $request, Task $task): JsonResponse
    {
        try {
            Gate::authorize('update', $task);
            Log::info('Updating task', ['task_id' => $task->id, 'data' => $request->all()]);
            
            $validated = $request->validate([
                'title' => 'sometimes|string|max:255',
                'description' => 'nullable|string',
                'assignee_id' => 'nullable|exists:users,id',
                'priority' => 'sometimes|in:low,medium,high',
                'due_date' => 'nullable|date',
                'completed_at' => 'nullable|date',
            ]);

            $oldValues = $task->only(array_keys($validated));
            
            DB::beginTransaction();
            
            $task->update($validated);

            // Log activity
            TaskActivity::create([
                'task_id' => $task->id,
                'user_id' => $request->user()->id,
                'action' => 'updated',
                'description' => 'Task updated',
                'old_values' => $oldValues,
                'new_values' => $validated
            ]);

            DB::commit();
            
            Log::info('Task updated successfully', ['task_id' => $task->id]);
            
            return response()->json([
                'success' => true,
                'data' => $task->fresh(['assignee', 'createdBy', 'comments.user', 'board', 'column'])
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Error updating task', [
                'task_id' => $task->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update task: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a task.
     */
    public function destroy(Task $task): JsonResponse
    {
        try {
            Gate::authorize('delete', $task);
            Log::info('Deleting task', ['task_id' => $task->id]);
            
            DB::beginTransaction();
            
            // The position updates are handled by the Task model's boot method
            $task->delete();
            
            DB::commit();
            
            Log::info('Task deleted successfully', ['task_id' => $task->id]);
            
            return response()->json([
                'success' => true,
                'message' => 'Task deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Error deleting task', [
                'task_id' => $task->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete task: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Move a task to a different column or position.
     */
    public function move(Request $request, Task $task): JsonResponse
    {
        try {
            Gate::authorize('move', $task);
            Log::info('Moving task', ['task_id' => $task->id, 'data' => $request->all()]);
            
            $validated = $request->validate([
                'column_id' => 'required|exists:board_columns,id',
                'position' => 'required|integer|min:0',
                'operation_id' => 'nullable|string',
                'client_timestamp' => 'nullable|integer',
            ]);

            // Check for conflicts - but allow some tolerance for rapid moves from same user
            // Only check conflicts if timestamp difference is more than 2 seconds
            if (isset($validated['client_timestamp'])) {
                $timeDifference = ($task->updated_at->timestamp * 1000) - $validated['client_timestamp'];
                
                // If task was updated more than 2 seconds after client's timestamp, it's likely a real conflict
                if ($timeDifference > 2000) {
                    return response()->json([
                        'success' => false,
                        'conflict' => true,
                        'message' => 'Task was modified by another user',
                        'current_state' => $task->fresh(['assignee', 'createdBy', 'column']),
                        'time_difference' => $timeDifference
                    ], 409);
                }
            }

            // Verify the column belongs to the same board
            $column = BoardColumn::where('id', $validated['column_id'])
                ->where('board_id', $task->board_id)
                ->firstOrFail();

            $oldColumnId = $task->column_id;
            $oldPosition = $task->position;
            
            DB::beginTransaction();
            
            // Update positions of other tasks
            if ($task->column_id != $validated['column_id']) {
                // Moving to different column
                Task::where('column_id', $task->column_id)
                    ->where('position', '>', $task->position)
                    ->decrement('position');
                    
                Task::where('column_id', $validated['column_id'])
                    ->where('position', '>=', $validated['position'])
                    ->increment('position');
            } else {
                // Moving within same column
                if ($validated['position'] > $task->position) {
                    // Moving down
                    Task::where('column_id', $task->column_id)
                        ->whereBetween('position', [$task->position + 1, $validated['position']])
                        ->decrement('position');
                } else if ($validated['position'] < $task->position) {
                    // Moving up
                    Task::where('column_id', $task->column_id)
                        ->whereBetween('position', [$validated['position'], $task->position - 1])
                        ->increment('position');
                }
            }

            // Update task position
            $task->update([
                'column_id' => $validated['column_id'],
                'position' => $validated['position'],
            ]);

            // Log activity
            $oldColumn = $task->board->columns->firstWhere('id', $oldColumnId);
            $newColumn = $task->board->columns->firstWhere('id', $validated['column_id']);
            
            TaskActivity::create([
                'task_id' => $task->id,
                'user_id' => $request->user()->id,
                'action' => 'moved',
                'description' => "Task moved from {$oldColumn->name} to {$newColumn->name}",
                'old_values' => ['column_id' => $oldColumnId, 'position' => $oldPosition],
                'new_values' => $validated
            ]);

            DB::commit();
            
            Log::info('Task moved successfully', [
                'task_id' => $task->id, 
                'from' => ['column' => $oldColumnId, 'position' => $oldPosition],
                'to' => ['column' => $validated['column_id'], 'position' => $validated['position']]
            ]);
            
            return response()->json([
                'success' => true,
                'data' => $task->fresh(['assignee', 'createdBy', 'comments.user', 'board', 'column']),
                'server_timestamp' => now()->timestamp * 1000,
                'operation_id' => $validated['operation_id'] ?? null
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Error moving task', [
                'task_id' => $task->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to move task: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark a task as completed.
     */
    public function complete(Task $task): JsonResponse
    {
        try {
            Gate::authorize('update', $task);
            Log::info('Marking task as completed', ['task_id' => $task->id]);
            
            DB::beginTransaction();
            
            $task->update(['completed_at' => now()]);

            // Log activity
            TaskActivity::create([
                'task_id' => $task->id,
                'user_id' => Auth::id(),
                'action' => 'completed',
                'description' => 'Task marked as completed'
            ]);

            DB::commit();
            
            Log::info('Task marked as completed successfully', ['task_id' => $task->id]);
            
            return response()->json([
                'success' => true,
                'data' => $task->fresh(['assignee', 'createdBy', 'comments.user', 'board', 'column'])
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Error completing task', [
                'task_id' => $task->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to complete task: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Assign a task to a user.
     */
    public function assignTask(Request $request, Task $task): JsonResponse
    {
        try {
            Gate::authorize('update', $task);
            Log::info('Assigning task', ['task_id' => $task->id, 'data' => $request->all()]);
            
            $validated = $request->validate([
                'user_id' => 'required|exists:users,id'
            ]);

            $oldAssignee = $task->assignee;
            
            DB::beginTransaction();
            
            $task->update(['assignee_id' => $validated['user_id']]);

            // Log activity
            TaskActivity::create([
                'task_id' => $task->id,
                'user_id' => Auth::id(),
                'action' => 'assigned',
                'description' => "Task assigned to {$task->fresh()->assignee->name}",
                'old_values' => ['assignee_id' => $oldAssignee?->id],
                'new_values' => ['assignee_id' => $validated['user_id']]
            ]);

            DB::commit();
            
            Log::info('Task assigned successfully', [
                'task_id' => $task->id, 
                'assignee_id' => $validated['user_id']
            ]);
            
            return response()->json([
                'success' => true,
                'data' => $task->fresh(['assignee', 'createdBy', 'comments.user', 'board', 'column'])
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Error assigning task', [
                'task_id' => $task->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to assign task: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Unassign a task.
     */
    public function unassignTask(Task $task): JsonResponse
    {
        try {
            Gate::authorize('update', $task);
            Log::info('Unassigning task', ['task_id' => $task->id]);
            
            $oldAssignee = $task->assignee;

            DB::beginTransaction();
            
            $task->update(['assignee_id' => null]);

            // Log activity
            TaskActivity::create([
                'task_id' => $task->id,
                'user_id' => Auth::id(),
                'action' => 'unassigned',
                'description' => $oldAssignee ? "Task unassigned from {$oldAssignee->name}" : "Task unassigned",
                'old_values' => ['assignee_id' => $oldAssignee?->id],
                'new_values' => ['assignee_id' => null]
            ]);

            DB::commit();
            
            Log::info('Task unassigned successfully', ['task_id' => $task->id]);
            
            return response()->json([
                'success' => true,
                'data' => $task->fresh(['assignee', 'createdBy', 'comments.user', 'board', 'column'])
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Error unassigning task', [
                'task_id' => $task->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to unassign task: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Duplicate a task.
     */
    public function duplicate(Task $task): JsonResponse
    {
        try {
            Gate::authorize('view', $task->board);
            Log::info('Duplicating task', ['task_id' => $task->id]);
            
            DB::beginTransaction();
            
            $newTask = $task->replicate();
            $newTask->title = $task->title . ' (Copy)';
            $newTask->position = Task::where('column_id', $task->column_id)->count();
            $newTask->created_by = Auth::id();
            $newTask->completed_at = null;
            $newTask->save();

            // Log activity for new task
            TaskActivity::create([
                'task_id' => $newTask->id,
                'user_id' => Auth::id(),
                'action' => 'created',
                'description' => "Task duplicated from #{$task->id}"
            ]);

            DB::commit();
            
            Log::info('Task duplicated successfully', [
                'original_task_id' => $task->id,
                'new_task_id' => $newTask->id
            ]);
            
            return response()->json([
                'success' => true,
                'data' => $newTask->load(['assignee', 'createdBy', 'comments.user', 'board', 'column'])
            ], 201);
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Error duplicating task', [
                'task_id' => $task->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to duplicate task: ' . $e->getMessage()
            ], 500);
        }
    }
}