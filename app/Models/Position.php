<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Position extends Model
{
    protected $fillable = [
        'title',
        'description',
        'slots',
        'weekly_salary',
        'is_open',
        'is_contractor',
    ];

    protected function casts(): array
    {
        return [
            'is_open' => 'boolean',
            'is_contractor' => 'boolean',
            'weekly_salary' => 'decimal:2',
        ];
    }

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    public function getActiveEmployeesCountAttribute(): int
    {
        return $this->employees()->where('status', 'active')->count();
    }

    public function getIsFullAttribute(): bool
    {
        return $this->getActiveEmployeesCountAttribute() >= $this->slots;
    }
}
