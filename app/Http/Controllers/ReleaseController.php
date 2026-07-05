<?php

namespace App\Http\Controllers;

use App\Enums\ReleaseType;
use App\Models\Artist;
use App\Models\Employee;
use App\Models\Label;
use App\Models\Release;
use App\Models\Sale;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ReleaseController extends Controller
{
    public function index(Request $request): Response
    {
        $sort = in_array($request->input('sort'), ['title', 'release_date', 'total_sales'])
            ? $request->input('sort')
            : 'release_date';
        $direction = $request->input('direction') === 'asc' ? 'asc' : 'desc';
        $artistFilter = $request->input('artist');
        $typeFilter = $request->input('type');
        $salesWeekFilter = $request->input('week');
        $releaseWeekNum = $request->integer('release_week');
        $releaseWeekYear = $request->integer('release_year', (int) now()->format('Y'));

        $query = Release::with(['artists', 'label'])->withSum('sales', 'quantity');

        if ($artistFilter) {
            $query->whereHas('artists', fn ($q) => $q->where('name', 'like', "%{$artistFilter}%"));
        }

        if ($typeFilter && in_array($typeFilter, ['Single', 'EP', 'Album'])) {
            $query->where('type', $typeFilter);
        }

        // Filtre par semaine de ventes
        if ($salesWeekFilter) {
            $weekStart = Carbon::parse($salesWeekFilter)->startOfWeek(Carbon::MONDAY)->toDateString();
            $weekEnd = Carbon::parse($salesWeekFilter)->endOfWeek(Carbon::SUNDAY)->toDateString();
            $query->whereHas('sales', fn ($q) => $q
                ->whereDate('sale_date', '>=', $weekStart)
                ->whereDate('sale_date', '<=', $weekEnd)
            );
        }

        // Filtre par numéro de semaine ISO de la date de sortie
        if ($releaseWeekNum >= 1 && $releaseWeekNum <= 53) {
            $releaseWeekStart = Carbon::now()->setISODate($releaseWeekYear, $releaseWeekNum, 1)->toDateString();
            $releaseWeekEnd = Carbon::now()->setISODate($releaseWeekYear, $releaseWeekNum, 7)->toDateString();
            $query->whereDate('release_date', '>=', $releaseWeekStart)
                ->whereDate('release_date', '<=', $releaseWeekEnd);
        }

        $releases = $query->get()->map(fn (Release $release) => [
            'id' => $release->id,
            'title' => $release->title,
            'type' => $release->type,
            'release_date' => $release->release_date->format('d/m/Y'),
            'release_date_raw' => $release->release_date->format('Y-m-d'),
            'label' => $release->label?->name ?? 'ULM Records',
            'artists' => $release->artists->pluck('name'),
            'total_sales' => (int) ($release->sales_sum_quantity ?? 0),
            'gross_revenue' => (int) ($release->sales_sum_quantity ?? 0) * 700,
            'genre' => $release->genre,
            'streaming_url' => $release->streaming_url,
            'cover_path' => $release->cover_path,
        ]);

        $releases = match ($sort) {
            'title' => $direction === 'asc' ? $releases->sortBy('title') : $releases->sortByDesc('title'),
            'total_sales' => $direction === 'asc' ? $releases->sortBy('total_sales') : $releases->sortByDesc('total_sales'),
            default => $direction === 'asc' ? $releases->sortBy('release_date_raw') : $releases->sortByDesc('release_date_raw'),
        };

        return Inertia::render('releases/index', [
            'releases' => $releases->values(),
            'filters' => [
                'sort' => $sort,
                'direction' => $direction,
                'artist' => $artistFilter ?? '',
                'type' => $typeFilter ?? '',
                'week' => $salesWeekFilter ?? '',
                'release_week' => $releaseWeekNum > 0 ? (string) $releaseWeekNum : '',
                'release_year' => (string) $releaseWeekYear,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('releases/form', [
            'labels' => Label::get(['id', 'name']),
            'artists' => Artist::with('label')->get(['id', 'name', 'label_id', 'contract_type']),
            'contractors' => $this->contractorsList(),
            'releaseTypes' => collect(ReleaseType::cases())->map(fn ($t) => $t->value),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:Single,EP,Album',
            'release_date' => 'required|date',
            'label_id' => 'nullable|exists:labels,id',
            'streaming_url' => 'nullable|url|max:500',
            'genre' => 'nullable|string|max:100',
            'cover' => 'nullable|image|max:4096',
            'artist_ids' => 'required|array|min:1',
            'artist_ids.*' => 'exists:artists,id',
            'contractor_ids' => 'nullable|array',
            'contractor_ids.*' => 'exists:employees,id',
        ]);

        if ($request->hasFile('cover')) {
            $validated['cover_path'] = $request->file('cover')->store('covers', 'public');
        }

        $artistIds = $validated['artist_ids'];
        $contractorIds = $validated['contractor_ids'] ?? [];
        $validated['label_id'] = $validated['label_id'] ?: null;
        unset($validated['cover'], $validated['artist_ids'], $validated['contractor_ids']);

        $release = Release::create($validated);
        $release->artists()->sync($artistIds);
        $release->contractors()->sync($contractorIds);

        return to_route('releases.show', $release)->with('success', 'Sortie créée.');
    }

    public function show(Release $release): Response
    {
        $release->load(['label', 'artists', 'contractors.position', 'sales.recordedBy']);

        $accounting = $release->computeAccounting();
        $totalArtistEarnings = array_sum(array_column($accounting, 'artist_earnings'));
        $totalLabelEarnings = array_sum(array_column($accounting, 'label_earnings'));

        $contractorRows = $release->contractors->map(function (Employee $e) {
            $fee = (float) ($e->fee_per_release ?? 0);
            $weeklyTotal = $e->weeklyContractorEarnings(now());
            $cappedThisWeek = $weeklyTotal >= 45000;

            return [
                'id' => $e->id,
                'name' => $e->name,
                'role' => $e->position?->title ?? '—',
                'fee_per_release' => $fee,
                'weekly_total' => $weeklyTotal,
                'is_capped' => $cappedThisWeek,
            ];
        });

        $totalContractorCost = $contractorRows->sum('fee_per_release');

        return Inertia::render('releases/show', [
            'release' => [
                'id' => $release->id,
                'title' => $release->title,
                'type' => $release->type,
                'release_date' => $release->release_date->format('d/m/Y'),
                'label' => $release->label?->name ?? 'ULM Records',
                'genre' => $release->genre,
                'streaming_url' => $release->streaming_url,
                'cover_path' => $release->cover_path,
                'artists' => $release->artists->map(fn ($a) => [
                    'id' => $a->id,
                    'name' => $a->name,
                    'contract_type' => $a->contract_type->label(),
                ]),
                'contractors' => $contractorRows,
                'total_contractor_cost' => $totalContractorCost,
                'total_sales' => $release->total_sales,
                'gross_revenue' => $release->gross_revenue,
                'accounting' => collect($accounting)->map(fn ($row) => [
                    'artist_name' => $row['artist']->name,
                    'artist_earnings' => $row['artist_earnings'],
                    'label_earnings' => $row['label_earnings'],
                    'surplus' => $row['surplus'],
                ]),
                'total_artist_earnings' => $totalArtistEarnings,
                'total_label_earnings' => $totalLabelEarnings,
                'sales' => $release->sales->map(fn (Sale $s) => [
                    'id' => $s->id,
                    'quantity' => $s->quantity,
                    'revenue' => $s->revenue,
                    'sale_date' => $s->sale_date->format('d/m/Y'),
                    'notes' => $s->notes,
                    'recorded_by' => $s->recordedBy->name,
                ]),
            ],
        ]);
    }

    public function edit(Release $release): Response
    {
        return Inertia::render('releases/form', [
            'release' => $release->load(['artists', 'contractors']),
            'labels' => Label::get(['id', 'name']),
            'artists' => Artist::with('label')->get(['id', 'name', 'label_id', 'contract_type']),
            'contractors' => $this->contractorsList(),
            'releaseTypes' => collect(ReleaseType::cases())->map(fn ($t) => $t->value),
        ]);
    }

    public function update(Request $request, Release $release): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:Single,EP,Album',
            'release_date' => 'required|date',
            'label_id' => 'nullable|exists:labels,id',
            'streaming_url' => 'nullable|url|max:500',
            'genre' => 'nullable|string|max:100',
            'cover' => 'nullable|image|max:4096',
            'artist_ids' => 'required|array|min:1',
            'artist_ids.*' => 'exists:artists,id',
            'contractor_ids' => 'nullable|array',
            'contractor_ids.*' => 'exists:employees,id',
        ]);

        if ($request->hasFile('cover')) {
            if ($release->cover_path) {
                Storage::disk('public')->delete($release->cover_path);
            }
            $validated['cover_path'] = $request->file('cover')->store('covers', 'public');
        }

        $artistIds = $validated['artist_ids'];
        $contractorIds = $validated['contractor_ids'] ?? [];
        $validated['label_id'] = $validated['label_id'] ?: null;
        unset($validated['cover'], $validated['artist_ids'], $validated['contractor_ids']);

        $release->update($validated);
        $release->artists()->sync($artistIds);
        $release->contractors()->sync($contractorIds);

        return to_route('releases.show', $release)->with('success', 'Sortie mise à jour.');
    }

    public function destroy(Release $release): RedirectResponse
    {
        if ($release->cover_path) {
            Storage::disk('public')->delete($release->cover_path);
        }

        $release->delete();

        return to_route('releases.index')->with('success', 'Sortie supprimée.');
    }

    /**
     * @return Collection<int, array{id: int, name: string, role: string, fee_per_release: float|null}>
     */
    private function contractorsList(): Collection
    {
        return Employee::with('position')
            ->whereHas('position', fn ($q) => $q->where('is_contractor', true))
            ->where('status', 'active')
            ->get()
            ->map(fn (Employee $e) => [
                'id' => $e->id,
                'name' => $e->name,
                'role' => $e->position?->title ?? '—',
                'fee_per_release' => $e->fee_per_release,
            ]);
    }
}
