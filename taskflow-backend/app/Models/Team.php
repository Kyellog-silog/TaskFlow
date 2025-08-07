<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property int $owner_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Board> $boards
 * @property-read int|null $boards_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\User> $members
 * @property-read int|null $members_count
 * @property-read \App\Models\User $owner
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Team forUser($userId)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Team newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Team newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Team query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Team whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Team whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Team whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Team whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Team whereOwnerId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Team whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class Team extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'owner_id',
    ];

    protected $with = ['owner', 'members'];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'team_members')
                    ->withPivot('role', 'joined_at')
                    ->withTimestamps();
    }

    public function boards(): HasMany
    {
        return $this->hasMany(Board::class);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('owner_id', $userId)
                    ->orWhereHas('members', function ($q) use ($userId) {
                        $q->where('user_id', $userId);
                    });
    }

    public function addMember(User $user, string $role = 'member'): void
    {
        $this->members()->syncWithoutDetaching([
            $user->id => [
                'role' => $role,
                'joined_at' => now(),
            ]
        ]);
    }

    public function removeMember(User $user): void
    {
        $this->members()->detach($user->id);
    }

    public function isOwner(User $user): bool
    {
        return $this->owner_id === $user->id;
    }

    public function isMember(User $user): bool
    {
        return $this->members->contains($user->id) || $this->isOwner($user);
    }

    public function isAdmin(User $user): bool
    {
        if ($this->isOwner($user)) {
            return true;
        }

        $member = $this->members->find($user->id);
        return $member && $member->pivot->role === 'admin';
    }
}
