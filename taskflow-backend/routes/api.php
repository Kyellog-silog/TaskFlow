<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\BoardController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\CommentController;
use App\Models\Task;
use Illuminate\Support\Facades\Gate;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public authentication routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [RegisteredUserController::class, 'store']);
    Route::post('/login', [AuthenticatedSessionController::class, 'store']);
    Route::post('/forgot-password', [PasswordResetLinkController::class, 'store']);
    Route::post('/reset-password', [NewPasswordController::class, 'store']);
});



// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);
        Route::post('/email/verification-notification', [EmailVerificationNotificationController::class, 'store']);
    });
    
    // User route
    Route::get('/user', function (Request $request) {
        return response()->json([
            'success' => true,
            'data' => [
                'user' => $request->user()
            ]
        ]);
    });
    

    // Team routes
    Route::apiResource('teams', TeamController::class);
    Route::post('/teams/{team}/members', [TeamController::class, 'addMember']);
    Route::delete('/teams/{team}/members/{user}', [TeamController::class, 'removeMember']);

    // Board routes
    Route::apiResource('boards', BoardController::class);
    Route::get('/teams/{team}/boards', [BoardController::class, 'byTeam']);
    Route::get('/boards', [BoardController::class, 'index']);

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

// Email verification (needs to be outside auth:sanctum middleware)
Route::get('/email/verify/{id}/{hash}', [\App\Http\Controllers\Auth\VerifyEmailController::class, '__invoke'])
    ->middleware(['auth:sanctum', 'signed', 'throttle:6,1'])
    ->name('verification.verify');

// Health check
Route::get('/health', function () {
    return response()->json([
        'status' => 'OK',
        'timestamp' => now(),
        'version' => '1.0.0',
        'laravel_version' => app()->version(),
    ]);
});

// CSRF token for SPA (not needed with Sanctum cookie-based auth, but kept for compatibility)
Route::get('/csrf-token', function () {
    return response()->json(['csrf_token' => csrf_token()]);
});

Route::get('/sanctum/csrf-cookie', function () {
    return response()->json([
        'message' => 'CSRF cookie set'
    ])->cookie('XSRF-TOKEN', csrf_token(), 60, '/', config('session.domain'), false, false);
});

// Board management routes
Route::middleware('auth:sanctum')->group(function () {
    // Existing board routes...
    Route::apiResource('boards', BoardController::class);
    
    // New board status routes
    Route::post('boards/{board}/archive', [BoardController::class, 'archive']);
    Route::post('boards/{board}/unarchive', [BoardController::class, 'unarchive']);
    Route::post('boards/{id}/restore', [BoardController::class, 'restore']);
});
