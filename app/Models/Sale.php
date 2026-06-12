<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Sale extends Model
{
    protected $fillable = [
        'release_id',
        'quantity',
        'sale_date',
        'recorded_by',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'sale_date' => 'date',
        ];
    }

    public function release(): BelongsTo
    {
        return $this->belongsTo(Release::class);
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function getRevenueAttribute(): float
    {
        return $this->quantity * 700;
    }
}
