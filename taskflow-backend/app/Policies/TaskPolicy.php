<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    public function view(User $user, Task $task): bool
    {
        return $task->board->canUserAccess($user);
    }

    public function create(User $user): bool
    {
        return true; // Any authenticated user can create a task (if they have board access)
    }

    public function update(User $user, Task $task): bool
    {
        return $task->board->canUserAccess($user);
    }

    public function delete(User $user, Task $task): bool
    {
        return $task->board->canUserManage($user) || $task->created_by === $user->id;
    }
}
