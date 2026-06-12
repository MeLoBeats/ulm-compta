<?php

namespace App\Models;

use App\Enums\ContractType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Artist extends Model
{
    protected $fillable = [
        'name',
        'label_id',
        'contract_type',
        'bio',
        'image_path',
    ];

    protected function casts(): array
    {
        return [
            'contract_type' => ContractType::class,
        ];
    }

    public function label(): BelongsTo
    {
        return $this->belongsTo(Label::class);
    }

    public function releases(): BelongsToMany
    {
        return $this->belongsToMany(Release::class);
    }

    /**
     * Calculate revenue split for a given gross revenue amount.
     *
     * @return array{artist: float, label: float, surplus: float}
     */
    public function calculateRevenueSplit(float $grossRevenue): array
    {
        $artistCut = $grossRevenue * ($this->contract_type->artistPercentage() / 100);
        $labelCut = $grossRevenue * ($this->contract_type->labelPercentage() / 100);
        $surplus = 0.0;

        if ($artistCut > 45000) {
            $surplus = $artistCut - 45000;
            $artistCut = 45000;
            $labelCut += $surplus;
        }

        return [
            'artist' => $artistCut,
            'label' => $labelCut,
            'surplus' => $surplus,
        ];
    }

    public function releasesThisWeek(): int
    {
        return $this->releases()
            ->whereBetween('release_date', [now()->startOfWeek(), now()->endOfWeek()])
            ->count();
    }
}
