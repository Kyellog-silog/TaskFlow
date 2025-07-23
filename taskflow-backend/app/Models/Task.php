<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Task extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'board_id',
        'column_id',
        'assignee_id',
        'created_by',
        'priority',
        'due_date',
        'position',
        'completed_at'
    ];

    protected $casts = [
        'due_date' => 'date',
        'completed_at' => 'datetime',
        'position' => 'integer',
    ];

    protected $with = ['assignee', 'createdBy'];

    protected $appends = ['is_overdue', 'is_completed', 'status'];

    // Relationships
    public function board(): BelongsTo
    {
        return $this->belongsTo(Board::class);
    }

    public function column(): BelongsTo
    {
        return $this->belongsTo(BoardColumn::class, 'column_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(TaskComment::class)->with('user')->latest();
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(TaskAttachment::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(TaskActivity::class)->with('user')->latest();
    }

    // Scopes
    public function scopeByBoard($query, $boardId)
    {
        return $query->where('board_id', $boardId);
    }

    public function scopeByColumn($query, $columnId)
    {
        return $query->where('column_id', $columnId);
    }

    public function scopeByAssignee($query, $assigneeId)
    {
        return $query->where('assignee_id', $assigneeId);
    }

    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->whereHas('column', function ($q) use ($status) {
            $q->where('name', $status);
        });
    }

    public function scopeDueSoon($query, $days = 7)
    {
        return $query->where('due_date', '<=', now()->addDays($days))
                    ->where('due_date', '>=', now())
                    ->whereNull('completed_at');
    }

    public function scopeOverdue($query)
    {
        return $query->where('due_date', '<', now())
                    ->whereNull('completed_at');
    }

    public function scopeCompleted($query)
    {
        return $query->whereNotNull('completed_at');
    }

    public function scopeIncomplete($query)
    {
        return $query->whereNull('completed_at');
    }

    public function scopeHighPriority($query)
    {
        return $query->where('priority', 'high');
    }

    public function scopeOrderedByPosition($query)
    {
        return $query->orderBy('position');
    }

    public function scopeOrderedByDueDate($query)
    {
        return $query->orderBy('due_date');
    }

    public function scopeOrderedByPriority($query)
    {
        return $query->orderByRaw("FIELD(priority, 'high', 'medium', 'low')");
    }

    public function scopeForUser($query, $userId)
    {
        return $query->whereHas('board.team', function ($q) use ($userId) {
            $q->where('owner_id', $userId)
              ->orWhereHas('members', function ($memberQuery) use ($userId) {
                  $memberQuery->where('user_id', $userId);
              });
        });
    }

    public function scopeAssignedToUser($query, $userId)
    {
        return $query->where('assignee_id', $userId);
    }

    public function scopeCreatedByUser($query, $userId)
    {
        return $query->where('created_by', $userId);
    }

    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('title', 'like', "%{$search}%")
              ->orWhere('description', 'like', "%{$search}%");
        });
    }

    // Accessors
    public function getIsOverdueAttribute(): bool
    {
        return $this->due_date && 
               $this->due_date->isPast() && 
               !$this->completed_at;
    }

    public function getIsCompletedAttribute(): bool
    {
        return !is_null($this->completed_at);
    }

    public function getStatusAttribute(): string
    {
        return $this->column ? strtolower(str_replace(' ', '-', $this->column->name)) : 'unknown';
    }

    public function getDaysUntilDueAttribute(): ?int
    {
        if (!$this->due_date) {
            return null;
        }

        return now()->diffInDays($this->due_date, false);
    }

    public function getTimeSpentAttribute(): ?int
    {
        // Calculate time spent based on activities or other logic
        // This is a placeholder - you might want to implement time tracking
        return null;
    }

    public function getProgressPercentageAttribute(): int
    {
        // Calculate progress based on column position or completion status
        if ($this->is_completed) {
            return 100;
        }

        // You could implement more sophisticated progress calculation
        // based on column positions, subtasks, etc.
        $columns = $this->board->columns()->ordered()->get();
        $currentColumnIndex = $columns->search(function ($column) {
            return $column->id === $this->column_id;
        });

        if ($currentColumnIndex === false) {
            return 0;
        }

        return (int) (($currentColumnIndex / ($columns->count() - 1)) * 100);
    }

    // Methods
    public function isOverdue(): bool
    {
        return $this->is_overdue;
    }

    public function isCompleted(): bool
    {
        return $this->is_completed;
    }

    public function isDueSoon($days = 7): bool
    {
        return $this->due_date && 
               $this->due_date->isBetween(now(), now()->addDays($days)) &&
               !$this->completed_at;
    }

    public function canBeEditedBy(User $user): bool
    {
        return $this->board->canUserAccess($user);
    }

    public function canBeDeletedBy(User $user): bool
    {
        return $this->board->canUserManage($user) || 
               $this->created_by === $user->id;
    }

    public function canBeAssignedBy(User $user): bool
    {
        return $this->board->canUserAccess($user);
    }

    public function markAsCompleted(User $user = null): void
    {
        $this->update(['completed_at' => now()]);

        // Log activity
        $this->activities()->create([
            'user_id' => $user ? $user->id : auth()->id(),
            'action' => 'completed',
            'description' => 'Task marked as completed'
        ]);
    }

    public function markAsIncomplete(User $user = null): void
    {
        $this->update(['completed_at' => null]);

        // Log activity
        $this->activities()->create([
            'user_id' => $user ? $user->id : auth()->id(),
            'action' => 'reopened',
            'description' => 'Task marked as incomplete'
        ]);
    }

    public function assignTo(User $assignee, User $assigner = null): void
    {
        $oldAssignee = $this->assignee;
        
        $this->update(['assignee_id' => $assignee->id]);

        // Log activity
        $this->activities()->create([
            'user_id' => $assigner ? $assigner->id : auth()->id(),
            'action' => 'assigned',
            'description' => "Task assigned to {$assignee->name}",
            'old_values' => ['assignee_id' => $oldAssignee?->id],
            'new_values' => ['assignee_id' => $assignee->id]
        ]);
    }

    public function unassign(User $user = null): void
    {
        $oldAssignee = $this->assignee;
        
        $this->update(['assignee_id' => null]);

        // Log activity
        $this->activities()->create([
            'user_id' => $user ? $user->id : auth()->id(),
            'action' => 'unassigned',
            'description' => "Task unassigned from {$oldAssignee?->name}",
            'old_values' => ['assignee_id' => $oldAssignee?->id],
            'new_values' => ['assignee_id' => null]
        ]);
    }

    public function moveToColumn(BoardColumn $column, int $position = null, User $user = null): void
    {
        $oldColumn = $this->column;
        $oldPosition = $this->position;

        // If no position specified, put at end
        if ($position === null) {
            $position = Task::where('column_id', $column->id)->count();
        }

        // Update positions in old column
        Task::where('column_id', $this->column_id)
            ->where('position', '>', $this->position)
            ->decrement('position');

        // Update positions in new column
        Task::where('column_id', $column->id)
            ->where('position', '>=', $position)
            ->increment('position');

        // Update task
        $this->update([
            'column_id' => $column->id,
            'position' => $position
        ]);

        // Log activity
        $this->activities()->create([
            'user_id' => $user ? $user->id : auth()->id(),
            'action' => 'moved',
            'description' => "Task moved from {$oldColumn->name} to {$column->name}",
            'old_values' => ['column_id' => $oldColumn->id, 'position' => $oldPosition],
            'new_values' => ['column_id' => $column->id, 'position' => $position]
        ]);
    }

    public function duplicate(User $user = null): Task
    {
        $newTask = $this->replicate();
        $newTask->title = $this->title . ' (Copy)';
        $newTask->position = Task::where('column_id', $this->column_id)->count();
        $newTask->created_by = $user ? $user->id : auth()->id();
        $newTask->completed_at = null;
        $newTask->save();

        // Log activity for new task
        $newTask->activities()->create([
            'user_id' => $user ? $user->id : auth()->id(),
            'action' => 'created',
            'description' => "Task duplicated from #{$this->id}"
        ]);

        return $newTask;
    }

    public function addComment(string $content, User $user = null): TaskComment
    {
        $comment = $this->comments()->create([
            'user_id' => $user ? $user->id : auth()->id(),
            'content' => $content
        ]);

        // Log activity
        $this->activities()->create([
            'user_id' => $user ? $user->id : auth()->id(),
            'action' => 'commented',
            'description' => 'Added a comment to the task'
        ]);

        return $comment;
    }

    public function updatePriority(string $priority, User $user = null): void
    {
        $oldPriority = $this->priority;
        
        $this->update(['priority' => $priority]);

        // Log activity
        $this->activities()->create([
            'user_id' => $user ? $user->id : auth()->id(),
            'action' => 'priority_changed',
            'description' => "Priority changed from {$oldPriority} to {$priority}",
            'old_values' => ['priority' => $oldPriority],
            'new_values' => ['priority' => $priority]
        ]);
    }

    public function updateDueDate($dueDate, User $user = null): void
    {
        $oldDueDate = $this->due_date;
        
        $this->update(['due_date' => $dueDate]);

        // Log activity
        $this->activities()->create([
            'user_id' => $user ? $user->id : auth()->id(),
            'action' => 'due_date_changed',
            'description' => $dueDate 
                ? "Due date set to " . \Carbon\Carbon::parse($dueDate)->format('M j, Y')
                : "Due date removed",
            'old_values' => ['due_date' => $oldDueDate],
            'new_values' => ['due_date' => $dueDate]
        ]);
    }

    // Boot method for model events
    protected static function boot()
    {
        parent::boot();

        // When creating a task, set position if not provided
        static::creating(function ($task) {
            if (!$task->position) {
                $task->position = Task::where('column_id', $task->column_id)->count();
            }
        });

        // When deleting a task, update positions of remaining tasks
        static::deleting(function ($task) {
            Task::where('column_id', $task->column_id)
                ->where('position', '>', $task->position)
                ->decrement('position');
        });
    }
}
