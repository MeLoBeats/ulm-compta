<?php

namespace App\Models;

use App\Enums\EmployeeStatus;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Employee extends Model
{
    protected $fillable = [
        'name',
        'position_id',
        'label_id',
        'user_id',
        'hired_at',
        'fired_at',
        'weekly_salary',
        'fee_per_release',
        'rib',
        'phone',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'hired_at' => 'date',
            'fired_at' => 'date',
            'weekly_salary' => 'decimal:2',
            'fee_per_release' => 'decimal:2',
            'status' => EmployeeStatus::class,
        ];
    }

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class);
    }

    public function label(): BelongsTo
    {
        return $this->belongsTo(Label::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function directedLabel(): HasOne
    {
        return $this->hasOne(Label::class, 'director_employee_id');
    }

    public function releasesWorkedOn(): BelongsToMany
    {
        return $this->belongsToMany(Release::class, 'contractor_release');
    }

    public function getIsActiveAttribute(): bool
    {
        return $this->status === EmployeeStatus::Active;
    }

    public function getIsContractorAttribute(): bool
    {
        return $this->position?->is_contractor === true;
    }

    /**
     * Total contractor earnings for a given week (ISO week string "YYYY-WW").
     * Capped at $45,000.
     */
    public function weeklyContractorEarnings(?Carbon $weekOf = null): float
    {
        $weekOf ??= now();
        $fee = (float) ($this->fee_per_release ?? 0);

        $count = $this->releasesWorkedOn()
            ->whereBetween('release_date', [
                $weekOf->copy()->startOfWeek(),
                $weekOf->copy()->endOfWeek(),
            ])
            ->count();

        return min($fee * $count, 45000);
    }
}
