<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GraphicWork extends Model
{
    /** @var array<string, int> */
    const PRICES = ['cover' => 3000, 'affiche' => 5000];

    protected $fillable = [
        'week_start',
        'employee_id',
        'work_type',
        'quantity',
        'notes',
        'recorded_by',
    ];

    protected function casts(): array
    {
        return [
            'week_start' => 'date',
            'quantity' => 'integer',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function getTotalAttribute(): float
    {
        return (float) ($this->quantity * (self::PRICES[$this->work_type] ?? 0));
    }
}
