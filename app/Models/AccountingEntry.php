<?php

namespace App\Models;

use App\Enums\EntryType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccountingEntry extends Model
{
    protected $fillable = [
        'week_start',
        'type',
        'category',
        'amount',
        'label',
        'notes',
        'recorded_by',
    ];

    protected function casts(): array
    {
        return [
            'week_start' => 'date',
            'type' => EntryType::class,
            'amount' => 'decimal:2',
        ];
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function categoryLabel(): string
    {
        return $this->type->categories()[$this->category] ?? $this->category;
    }
}
