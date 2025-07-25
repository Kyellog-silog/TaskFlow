<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Board extends Model
{
    use HasFactory;
    protected $appends = ['created_by'];

    protected $fillable = [
        'name',
        'description',
        'team_id',
        'created_by',
    ];

    protected $with = ['team', 'createdBy', 'columns'];

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class)->withDefault();
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function columns(): HasMany
    {
        return $this->hasMany(BoardColumn::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where(function($q) use ($userId) {
        $q->where('created_by', $userId)
            ->whereNull('team_id')
            ->orWhereHas('team', function ($q) use ($userId) {
                $q->forUser($userId);
            });
        });
    }

    public function canUserAccess(User $user): bool
    {
        if (!$this->team_id){
            return $this->created_by == $user->id;
        }
        return $this->team->isMember($user);
    }

    public function canUserManage(User $user): bool
    {
        if (!$this->team_id){
            return $this->created_by == $user->id;
        }
        return $this->team->isAdmin($user) || $this->createdBy?->id === $user->id;
    }

}
