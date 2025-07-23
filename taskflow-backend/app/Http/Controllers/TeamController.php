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
                    ->get();

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

        return response()->json([
            'success' => true,
            'data' => $team->load(['owner', 'members', 'boards'])
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
}
