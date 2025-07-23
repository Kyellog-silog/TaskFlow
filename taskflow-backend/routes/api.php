<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\BoardController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\CommentController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/refresh', [AuthController::class, 'refresh']);

    // Team routes
    Route::apiResource('teams', TeamController::class);
    Route::post('/teams/{team}/members', [TeamController::class, 'addMember']);
    Route::delete('/teams/{team}/members/{user}', [TeamController::class, 'removeMember']);

    // Board routes
    Route::apiResource('boards', BoardController::class);
    Route::get('/teams/{team}/boards', [BoardController::class, 'byTeam']);

    // Task routes
    Route::apiResource('tasks', TaskController::class);
    Route::post('/tasks/{task}/move', [TaskController::class, 'move']);
    Route::post('/tasks/{task}/complete', [TaskController::class, 'complete']);
    Route::post('/tasks/{task}/assign', [TaskController::class, 'assignTask']);
    Route::delete('/tasks/{task}/assign', [TaskController::class, 'unassignTask']);
    Route::post('/tasks/{task}/duplicate', [TaskController::class, 'duplicate']);

    // Comment routes
    Route::get('/tasks/{task}/comments', [CommentController::class, 'index']);
    Route::post('/tasks/{task}/comments', [CommentController::class, 'store']);
    Route::delete('/tasks/{task}/comments/{comment}', [CommentController::class, 'destroy']);

    // Task activities
    Route::get('/tasks/{task}/activities', function(Task $task) {
        Gate::authorize('view', $task);
        return response()->json([
            'success' => true,
            'data' => $task->activities()->with('user')->latest()->get()
        ]);
    });

    // File upload routes (for future implementation)
    Route::post('/tasks/{task}/attachments', function() {
        return response()->json(['message' => 'File upload not implemented yet']);
    });
});

// Health check
Route::get('/health', function () {
    return response()->json([
        'status' => 'OK',
        'timestamp' => now(),
        'version' => '1.0.0',
        'laravel_version' => app()->version(),
    ]);
});

// CSRF token for SPA
Route::get('/csrf-token', function () {
    return response()->json(['csrf_token' => csrf_token()]);
});
