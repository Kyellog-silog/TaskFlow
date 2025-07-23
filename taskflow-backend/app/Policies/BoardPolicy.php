<?php

namespace App\Policies;

use App\Models\Board;
use App\Models\User;

class BoardPolicy
{
    public function view(User $user, Board $board): bool
    {
        return $board->canUserAccess($user);
    }

    public function create(User $user): bool
    {
        return true; // Any authenticated user can create a board (if they have team access)
    }

    public function update(User $user, Board $board): bool
    {
        return $board->canUserManage($user);
    }

    public function delete(User $user, Board $board): bool
    {
        return $board->canUserManage($user);
    }
}
