<?php

namespace App\Http\Controllers;

use App\Models\Team;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class TeamController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $teams = Team::forUser($request->user()->id)
                    ->with(['owner', 'members', 'boards'])
                    ->withCount(['members', 'boards'])
                    ->get()
                    ->map(function ($team) {
                        // Calculate total tasks across all team boards
                        $tasksCount = $team->boards()->withCount('tasks')->get()->sum('tasks_count');
                        
                        return [
                            'id' => $team->id,
                            'name' => $team->name,
                            'description' => $team->description,
                            'owner' => $team->owner,
                            'members' => $team->members->map(function ($member) {
                                return [
                                    'id' => $member->id,
                                    'name' => $member->name,
                                    'email' => $member->email,
                                    'avatar' => $member->avatar_url ?? null,
                                    'role' => $member->pivot->role,
                                    'joined_at' => $member->pivot->joined_at,
                                ];
                            }),
                            'boards' => $team->boards_count,
                            'tasks' => $tasksCount,
                            'created_at' => $team->created_at,
                            'updated_at' => $team->updated_at,
                        ];
                    });

        return response()->json([
            'success' => true,
            'data' => $teams
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $team = Team::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'owner_id' => $request->user()->id,
        ]);

        // Add the owner as a member with admin role
        $team->addMember($request->user(), 'admin');

        return response()->json([
            'success' => true,
            'data' => $team->load(['owner', 'members', 'boards'])
        ], 201);
    }

    public function show(Team $team): JsonResponse
    {
        Gate::authorize('view', $team);

        $team->load(['owner', 'members', 'boards']);
        $tasksCount = $team->boards()->withCount('tasks')->get()->sum('tasks_count');

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $team->id,
                'name' => $team->name,
                'description' => $team->description,
                'owner' => $team->owner,
                'members' => $team->members->map(function ($member) {
                    return [
                        'id' => $member->id,
                        'name' => $member->name,
                        'email' => $member->email,
                        'avatar' => $member->avatar_url ?? null,
                        'role' => $member->pivot->role,
                        'joined_at' => $member->pivot->joined_at,
                    ];
                }),
                'boards' => $team->boards->count(),
                'tasks' => $tasksCount,
                'created_at' => $team->created_at,
                'updated_at' => $team->updated_at,
            ]
        ]);
    }

    public function update(Request $request, Team $team): JsonResponse
    {
        Gate::authorize('update', $team);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $team->update($validated);

        return response()->json([
            'success' => true,
            'data' => $team->fresh(['owner', 'members', 'boards'])
        ]);
    }

    public function destroy(Team $team): JsonResponse
    {
        Gate::authorize('delete', $team);

        $team->delete();

        return response()->json([
            'success' => true,
            'message' => 'Team deleted successfully'
        ]);
    }

    public function addMember(Request $request, Team $team): JsonResponse
    {
        Gate::authorize('manage', $team);

        $validated = $request->validate([
            'email' => 'required|email|exists:users,email',
            'role' => 'in:admin,member',
        ]);

        $user = User::where('email', $validated['email'])->first();
        $role = $validated['role'] ?? 'member';

        if ($team->isMember($user)) {
            return response()->json([
                'success' => false,
                'message' => 'User is already a member of this team'
            ], 400);
        }

        $team->addMember($user, $role);

        return response()->json([
            'success' => true,
            'message' => 'Member added successfully',
            'data' => $team->fresh(['members'])
        ]);
    }

    public function removeMember(Team $team, User $user): JsonResponse
    {
        Gate::authorize('manage', $team);

        if ($team->isOwner($user)) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot remove team owner'
            ], 400);
        }

        if (!$team->isMember($user)) {
            return response()->json([
                'success' => false,
                'message' => 'User is not a member of this team'
            ], 400);
        }

        $team->removeMember($user);

        return response()->json([
            'success' => true,
            'message' => 'Member removed successfully'
        ]);
    }

    public function updateMemberRole(Request $request, Team $team, User $user): JsonResponse
    {
        Gate::authorize('manage', $team);

        $validated = $request->validate([
            'role' => 'required|in:admin,member,viewer'
        ]);

        if ($team->isOwner($user)) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot change owner role'
            ], 400);
        }

        if (!$team->isMember($user)) {
            return response()->json([
                'success' => false,
                'message' => 'User is not a member of this team'
            ], 400);
        }

        // Update the member's role in the pivot table
        $team->members()->updateExistingPivot($user->id, ['role' => $validated['role']]);

        // Notify via SSE so other sessions can refresh
        try {
            \App\Http\Controllers\EventsController::queueEvent('team.updated', [
                'teamId' => $team->id,
                'userId' => $user->id,
                'role' => $validated['role'],
                'timestamp' => now()->timestamp,
            ]);
        } catch (\Throwable $e) {
            // Don't fail the request if SSE queueing fails
        }

        return response()->json([
            'success' => true,
            'message' => 'Member role updated successfully',
            'data' => $team->fresh(['members'])
        ]);
    }

    public function getTeamBoards(Team $team): JsonResponse
    {
        Gate::authorize('view', $team);

        $boards = $team->boards()
                      ->with(['columns', 'createdBy'])
                      ->withCount(['tasks', 'columns'])
                      ->get()
                      ->map(function ($board) {
                          return [
                              'id' => $board->id,
                              'name' => $board->name,
                              'description' => $board->description,
                              'created_by' => $board->createdBy,
                              'tasks_count' => $board->tasks_count,
                              'columns_count' => $board->columns_count,
                              'created_at' => $board->created_at,
                              'updated_at' => $board->updated_at,
                          ];
                      });

        return response()->json([
            'success' => true,
            'data' => $boards
        ]);
    }
}
