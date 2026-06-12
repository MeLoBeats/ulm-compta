<?php

namespace App\Models;

use App\Enums\ReleaseType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;

class Release extends Model
{
    protected $fillable = [
        'title',
        'type',
        'release_date',
        'label_id',
        'streaming_url',
        'cover_path',
        'genre',
    ];

    protected function casts(): array
    {
        return [
            'release_date' => 'date',
            'type' => ReleaseType::class,
        ];
    }

    public function label(): BelongsTo
    {
        return $this->belongsTo(Label::class);
    }

    public function artists(): BelongsToMany
    {
        return $this->belongsToMany(Artist::class);
    }

    public function contractors(): BelongsToMany
    {
        return $this->belongsToMany(Employee::class, 'contractor_release');
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function getTotalSalesAttribute(): int
    {
        return $this->sales()->sum('quantity');
    }

    public function getGrossRevenueAttribute(): float
    {
        return $this->getTotalSalesAttribute() * 700;
    }

    public function getTotalContractorCostAttribute(): float
    {
        return $this->contractors->sum(fn (Employee $e) => (float) ($e->fee_per_release ?? 0));
    }

    /**
     * Compute accounting split per artist for this release.
     *
     * @return array<int, array{artist: Artist, artist_earnings: float, label_earnings: float, surplus: float}>
     */
    public function computeAccounting(): array
    {
        $artists = $this->artists()->with('label')->get();

        if ($artists->isEmpty()) {
            return [];
        }

        $grossPerArtist = $this->getGrossRevenueAttribute() / $artists->count();

        return $artists->map(function (Artist $artist) use ($grossPerArtist) {
            $split = $artist->calculateRevenueSplit($grossPerArtist);

            return [
                'artist' => $artist,
                'artist_earnings' => $split['artist'],
                'label_earnings' => $split['label'],
                'surplus' => $split['surplus'],
            ];
        })->toArray();
    }
}
