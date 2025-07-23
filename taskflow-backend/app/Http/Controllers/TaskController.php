<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Board;
use App\Models\BoardColumn;
use App\Models\TaskActivity;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;

class TaskController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Task::query();

        // Filter by board
        if ($request->has('board_id')) {
            $board = Board::findOrFail($request->board_id);
            Gate::authorize('view', $board);
            $query->byBoard($request->board_id);
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

        $tasks = $query->with(['assignee', 'createdBy', 'comments.user', 'board', 'column'])
                      ->orderBy('position')
                      ->get();

        return response()->json([
            'success' => true,
            'data' => $tasks
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'board_id' => 'required|exists:boards,id',
            'column_id' => 'required|exists:board_columns,id',
            'assignee_id' => 'nullable|exists:users,id',
            'priority' => 'in:low,medium,high',
            'due_date' => 'nullable|date',
        ]);

        $board = Board::findOrFail($validated['board_id']);
        Gate::authorize('view', $board);

        // Verify column belongs to board
        $column = BoardColumn::where('id', $validated['column_id'])
                            ->where('board_id', $validated['board_id'])
                            ->firstOrFail();

        $validated['created_by'] = auth()->id();
        $validated['position'] = Task::where('column_id', $validated['column_id'])->count();

        DB::beginTransaction();
        try {
            $task = Task::create($validated);

            // Log activity
            TaskActivity::create([
                'task_id' => $task->id,
                'user_id' => auth()->id(),
                'action' => 'created',
                'description' => 'Task created'
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $task->load(['assignee', 'createdBy', 'comments.user', 'board', 'column'])
            ], 201);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create task'
            ], 500);
        }
    }

    public function show(Task $task): JsonResponse
    {
        Gate::authorize('view', $task);

        return response()->json([
            'success' => true,
            'data' => $task->load([
                'assignee', 
                'createdBy', 
                'comments.user', 
                'activities.user', 
                'board', 
                'column'
            ])
        ]);
    }

    public function update(Request $request, Task $task): JsonResponse
    {
        Gate::authorize('update', $task);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'assignee_id' => 'nullable|exists:users,id',
            'priority' => 'sometimes|in:low,medium,high',
            'due_date' => 'nullable|date',
        ]);

        $oldValues = $task->only(array_keys($validated));
        
        DB::beginTransaction();
        try {
            $task->update($validated);

            // Log activity
            TaskActivity::create([
                'task_id' => $task->id,
                'user_id' => Auth::id(),
                'action' => 'updated',
                'description' => 'Task updated',
                'old_values' => $oldValues,
                'new_values' => $validated
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $task->fresh(['assignee', 'createdBy', 'comments.user', 'board', 'column'])
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update task'
            ], 500);
        }
    }

    public function move(Request $request, Task $task): JsonResponse
    {
        Gate::authorize('update', $task);

        $validated = $request->validate([
            'column_id' => 'required|exists:board_columns,id',
            'position' => 'required|integer|min:0'
        ]);

        // Verify column belongs to same board
        $column = BoardColumn::where('id', $validated['column_id'])
                            ->where('board_id', $task->board_id)
                            ->firstOrFail();

        $oldColumnId = $task->column_id;
        $oldPosition = $task->position;

        DB::beginTransaction();
        try {
            // Update positions in old column (move tasks up)
            Task::where('column_id', $oldColumnId)
                ->where('position', '>', $oldPosition)
                ->decrement('position');

            // Update positions in new column (make space)
            Task::where('column_id', $validated['column_id'])
                ->where('position', '>=', $validated['position'])
                ->increment('position');

            // Update task
            $task->update([
                'column_id' => $validated['column_id'],
                'position' => $validated['position']
            ]);

            // Log activity
            TaskActivity::create([
                'task_id' => $task->id,
                'user_id' => auth()->id(),
                'action' => 'moved',
                'description' => "Task moved from {$task->board->columns->find($oldColumnId)->name} to {$column->name}",
                'old_values' => ['column_id' => $oldColumnId, 'position' => $oldPosition],
                'new_values' => $validated
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $task->fresh(['assignee', 'createdBy', 'comments.user', 'board', 'column'])
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Failed to move task'
            ], 500);
        }
    }

    public function complete(Task $task): JsonResponse
    {
        Gate::authorize('update', $task);

        DB::beginTransaction();
        try {
            $task->update(['completed_at' => now()]);

            // Log activity
            TaskActivity::create([
                'task_id' => $task->id,
                'user_id' => Auth::id(),
                'action' => 'completed',
                'description' => 'Task marked as completed'
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $task->fresh(['assignee', 'createdBy', 'comments.user', 'board', 'column'])
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Failed to complete task'
            ], 500);
        }
    }

    public function destroy(Task $task): JsonResponse
    {
        Gate::authorize('delete', $task);

        DB::beginTransaction();
        try {
            // Update positions of remaining tasks in the same column
            Task::where('column_id', $task->column_id)
                ->where('position', '>', $task->position)
                ->decrement('position');

            $task->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Task deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete task'
            ], 500);
        }
    }

    // Additional helper methods for task management
    public function assignTask(Request $request, Task $task): JsonResponse
    {
        Gate::authorize('update', $task);

        $validated = $request->validate([
            'assignee_id' => 'required|exists:users,id'
        ]);

        $oldAssignee = $task->assignee;
        
        DB::beginTransaction();
        try {
            $task->update($validated);

            // Log activity
            TaskActivity::create([
                'task_id' => $task->id,
                'user_id' => auth()->id(),
                'action' => 'assigned',
                'description' => "Task assigned to {$task->fresh()->assignee->name}",
                'old_values' => ['assignee_id' => $oldAssignee?->id],
                'new_values' => $validated
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $task->fresh(['assignee', 'createdBy', 'comments.user'])
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Failed to assign task'
            ], 500);
        }
    }

    public function unassignTask(Task $task): JsonResponse
    {
        Gate::authorize('update', $task);

        $oldAssignee = $task->assignee;

        DB::beginTransaction();
        try {
            $task->update(['assignee_id' => null]);

            // Log activity
            TaskActivity::create([
                'task_id' => $task->id,
                'user_id' => auth()->id(),
                'action' => 'unassigned',
                'description' => "Task unassigned from {$oldAssignee?->name}",
                'old_values' => ['assignee_id' => $oldAssignee?->id],
                'new_values' => ['assignee_id' => null]
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $task->fresh(['assignee', 'createdBy', 'comments.user'])
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Failed to unassign task'
            ], 500);
        }
    }

    public function duplicate(Task $task): JsonResponse
    {
        Gate::authorize('view', $task);

        DB::beginTransaction();
        try {
            $newTask = $task->replicate();
            $newTask->title = $task->title . ' (Copy)';
            $newTask->position = Task::where('column_id', $task->column_id)->count();
            $newTask->created_by = auth()->id();
            $newTask->completed_at = null;
            $newTask->save();

            // Log activity for new task
            TaskActivity::create([
                'task_id' => $newTask->id,
                'user_id' => auth()->id(),
                'action' => 'created',
                'description' => "Task duplicated from #{$task->id}"
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $newTask->load(['assignee', 'createdBy', 'comments.user', 'board', 'column'])
            ], 201);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Failed to duplicate task'
            ], 500);
        }
    }
}
