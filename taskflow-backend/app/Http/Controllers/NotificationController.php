<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $limit = (int) ($request->get('limit', 20));
        $notifications = Notification::where('user_id', $user->id)
            ->latest()
            ->limit($limit)
            ->get();
        return response()->json([
            'success' => true,
            'data' => $notifications,
        ]);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $user = $request->user();
        $count = Notification::where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();
        return response()->json([
            'success' => true,
            'data' => ['count' => $count],
        ]);
    }

    public function markRead(Request $request, Notification $notification): JsonResponse
    {
        if ($notification->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Not authorized to modify this notification'
            ], 403);
        }
        $notification->update(['read_at' => now()]);
        return response()->json([
            'success' => true,
            'data' => $notification,
        ]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $user = $request->user();
        Notification::where('user_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read',
        ]);
    }
}
