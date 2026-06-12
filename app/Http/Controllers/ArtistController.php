<?php

namespace App\Http\Controllers;

use App\Enums\ContractType;
use App\Models\Artist;
use App\Models\Label;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ArtistController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('artists/index', [
            'artists' => Artist::with('label')
                ->withCount('releases')
                ->latest()
                ->get()
                ->map(fn (Artist $artist) => [
                    'id' => $artist->id,
                    'name' => $artist->name,
                    'label' => $artist->label?->name ?? 'ULM Records (direct)',
                    'contract_type' => $artist->contract_type->label(),
                    'releases_count' => $artist->releases_count,
                    'image_path' => $artist->image_path,
                ]),
            'contractTypes' => collect(ContractType::cases())->map(fn ($c) => [
                'value' => $c->value,
                'label' => $c->label(),
            ]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('artists/form', [
            'labels' => Label::get(['id', 'name']),
            'contractTypes' => collect(ContractType::cases())->map(fn ($c) => [
                'value' => $c->value,
                'label' => $c->label(),
            ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'label_id' => 'nullable|exists:labels,id',
            'contract_type' => 'required|in:60_40,70_30,80_20',
            'bio' => 'nullable|string',
            'image' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $validated['image_path'] = $request->file('image')->store('artists', 'public');
        }

        $validated['label_id'] = $validated['label_id'] ?: null;
        unset($validated['image']);
        Artist::create($validated);

        return to_route('artists.index')->with('success', 'Artiste ajouté.');
    }

    public function show(Artist $artist): Response
    {
        $artist->load(['label', 'releases.sales']);

        $totalSales = $artist->releases->sum(fn ($r) => $r->total_sales);
        $totalGross = $totalSales * 700;
        $split = $artist->calculateRevenueSplit($totalGross);

        return Inertia::render('artists/show', [
            'artist' => [
                'id' => $artist->id,
                'name' => $artist->name,
                'label' => $artist->label?->name ?? 'ULM Records (direct)',
                'contract_type' => $artist->contract_type->label(),
                'artist_percentage' => $artist->contract_type->artistPercentage(),
                'label_percentage' => $artist->contract_type->labelPercentage(),
                'bio' => $artist->bio,
                'image_path' => $artist->image_path,
                'releases_this_week' => $artist->releasesThisWeek(),
                'releases' => $artist->releases->map(fn ($r) => [
                    'id' => $r->id,
                    'title' => $r->title,
                    'type' => $r->type,
                    'release_date' => $r->release_date->format('d/m/Y'),
                    'total_sales' => $r->total_sales,
                    'gross_revenue' => $r->gross_revenue,
                ]),
                'total_sales' => $totalSales,
                'gross_revenue' => $totalGross,
                'artist_earnings' => $split['artist'],
                'label_earnings' => $split['label'],
                'surplus' => $split['surplus'],
            ],
        ]);
    }

    public function edit(Artist $artist): Response
    {
        return Inertia::render('artists/form', [
            'artist' => $artist,
            'labels' => Label::get(['id', 'name']),
            'contractTypes' => collect(ContractType::cases())->map(fn ($c) => [
                'value' => $c->value,
                'label' => $c->label(),
            ]),
        ]);
    }

    public function update(Request $request, Artist $artist): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'label_id' => 'nullable|exists:labels,id',
            'contract_type' => 'required|in:60_40,70_30,80_20',
            'bio' => 'nullable|string',
            'image' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
            if ($artist->image_path) {
                Storage::disk('public')->delete($artist->image_path);
            }
            $validated['image_path'] = $request->file('image')->store('artists', 'public');
        }

        $validated['label_id'] = $validated['label_id'] ?: null;
        unset($validated['image']);
        $artist->update($validated);

        return to_route('artists.index')->with('success', 'Artiste mis à jour.');
    }

    public function destroy(Artist $artist): RedirectResponse
    {
        if ($artist->image_path) {
            Storage::disk('public')->delete($artist->image_path);
        }

        $artist->delete();

        return to_route('artists.index')->with('success', 'Artiste supprimé.');
    }
}
