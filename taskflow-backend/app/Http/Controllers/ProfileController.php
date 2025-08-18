<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use App\Models\Task;
use App\Models\TaskActivity;
use App\Models\TaskComment;

class ProfileController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        $tasksCompleted = Task::where('assignee_id', $user->id)->whereNotNull('completed_at')->count();
        $projectsActive = $user->teams()->withCount(['boards'])->get()->sum('boards_count');
        $teamCollaborations = $user->teams()->count();
        // Placeholder hours: count of activities * 0.5h
        $hoursWorked = (int) (TaskActivity::where('user_id', $user->id)->count() * 0.5);

        return response()->json([
            'success' => true,
            'data' => compact('tasksCompleted', 'projectsActive', 'teamCollaborations', 'hoursWorked')
        ]);
    }

    public function activity(Request $request): JsonResponse
    {
        $user = $request->user();
        $limit = (int) $request->get('limit', 10);
        $activities = TaskActivity::with(['task:id,title,board_id', 'user:id,name'])
            ->where('user_id', $user->id)
            ->latest()
            ->limit($limit)
            ->get()
            ->map(function ($a) {
                return [
                    'id' => $a->id,
                    'action' => $a->action,
                    'description' => $a->description,
                    'task' => $a->task ? [ 'id' => $a->task->id, 'title' => $a->task->title ] : null,
                    'created_at' => $a->created_at,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $activities,
        ]);
    }

    public function achievements(Request $request): JsonResponse
    {
        $user = $request->user();
        $completedCount = Task::where('assignee_id', $user->id)->whereNotNull('completed_at')->count();
        $teamsCount = $user->teams()->count();
        $commentsCount = TaskComment::where('user_id', $user->id)->count();
        $activitiesCount = TaskActivity::where('user_id', $user->id)->count();
        $hoursWorked = (int) ($activitiesCount * 0.5);
        $last7Completed = Task::where('assignee_id', $user->id)
            ->whereNotNull('completed_at')
            ->where('completed_at', '>=', now()->subDays(7))
            ->count();
        $punctual = Task::where('assignee_id', $user->id)
            ->whereNotNull('due_date')
            ->whereNotNull('completed_at')
            ->whereColumn('completed_at', '<=', 'due_date')
            ->count();

        $defs = [
            [
                'id' => 'first_task',
                'title' => 'First Task',
                'description' => 'Completed your first task',
                'icon' => '✨',
                'earned' => $completedCount >= 1,
                'progress' => min($completedCount, 1),
                'target' => 1,
            ],
            [
                'id' => 'task_master',
                'title' => 'Task Master',
                'description' => 'Completed 100+ tasks',
                'icon' => '🏆',
                'earned' => $completedCount >= 100,
                'progress' => min($completedCount, 100),
                'target' => 100,
            ],
            [
                'id' => 'task_legend',
                'title' => 'Task Legend',
                'description' => 'Completed 500+ tasks',
                'icon' => '💎',
                'earned' => $completedCount >= 500,
                'progress' => min($completedCount, 500),
                'target' => 500,
            ],
            [
                'id' => 'team_player',
                'title' => 'Team Player',
                'description' => 'Member of 3+ teams',
                'icon' => '🤝',
                'earned' => $teamsCount >= 3,
                'progress' => min($teamsCount, 3),
                'target' => 3,
            ],
            [
                'id' => 'collaborator',
                'title' => 'Active Collaborator',
                'description' => 'Posted 20+ comments',
                'icon' => '💬',
                'earned' => $commentsCount >= 20,
                'progress' => min($commentsCount, 20),
                'target' => 20,
            ],
            [
                'id' => 'marathoner',
                'title' => 'Marathoner',
                'description' => 'Logged 100+ hours of activity',
                'icon' => '⏱️',
                'earned' => $hoursWorked >= 100,
                'progress' => min($hoursWorked, 100),
                'target' => 100,
            ],
            [
                'id' => 'on_fire',
                'title' => 'On Fire',
                'description' => 'Completed 20 tasks in the last 7 days',
                'icon' => '🔥',
                'earned' => $last7Completed >= 20,
                'progress' => min($last7Completed, 20),
                'target' => 20,
            ],
            [
                'id' => 'punctual',
                'title' => 'Punctual Pro',
                'description' => 'Completed 10 tasks on or before due date',
                'icon' => '📅',
                'earned' => $punctual >= 10,
                'progress' => min($punctual, 10),
                'target' => 10,
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $defs,
        ]);
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $user = $request->user();
        $request->validate([
            'avatar' => 'required|image|max:3072', // 3MB
        ]);
        $path = $request->file('avatar')->store('avatars', 'public');
        $url = url(Storage::url($path));
        $user->avatar = $url;
        $user->save();

        return response()->json([
            'success' => true,
            'data' => [ 'user' => $user->fresh() ],
            'message' => 'Avatar updated',
        ]);
    }
}
