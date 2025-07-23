<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskComment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class CommentController extends Controller
{
    public function index(Task $task): JsonResponse
    {
        Gate::authorize('view', $task);

        $comments = $task->comments()
                        ->with('user')
                        ->latest()
                        ->get();

        return response()->json([
            'success' => true,
            'data' => $comments
        ]);
    }

    public function store(Request $request, Task $task): JsonResponse
    {
        Gate::authorize('view', $task);

        $validated = $request->validate([
            'content' => 'required|string|max:1000',
        ]);

        $comment = TaskComment::create([
            'task_id' => $task->id,
            'user_id' => $request->user()->id,
            'content' => $validated['content'],
        ]);

        // Log activity
        $task->activities()->create([
            'user_id' => $request->user()->id,
            'action' => 'commented',
            'description' => 'Added a comment to the task'
        ]);

        return response()->json([
            'success' => true,
            'data' => $comment->load('user')
        ], 201);
    }

    public function destroy(Task $task, TaskComment $comment): JsonResponse
    {
        Gate::authorize('view', $task);
        
        if ($comment->user_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'You can only delete your own comments'
            ], 403);
        }

        $comment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Comment deleted successfully'
        ]);
    }
}
