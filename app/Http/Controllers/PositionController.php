<?php

namespace App\Http\Controllers;

use App\Models\Position;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PositionController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('positions/index', [
            'positions' => Position::withCount(['employees as active_employees_count' => function ($query) {
                $query->where('status', 'active');
            }])->latest()->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('positions/form');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'slots' => 'required|integer|min:1',
            'weekly_salary' => 'nullable|numeric|min:0',
            'is_open' => 'boolean',
            'is_contractor' => 'boolean',
        ]);

        Position::create($validated);

        return to_route('positions.index')->with('success', 'Poste créé avec succès.');
    }

    public function edit(Position $position): Response
    {
        return Inertia::render('positions/form', [
            'position' => $position,
        ]);
    }

    public function update(Request $request, Position $position): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'slots' => 'required|integer|min:1',
            'weekly_salary' => 'nullable|numeric|min:0',
            'is_open' => 'boolean',
            'is_contractor' => 'boolean',
        ]);

        $position->update($validated);

        return to_route('positions.index')->with('success', 'Poste mis à jour.');
    }

    public function destroy(Position $position): RedirectResponse
    {
        $position->delete();

        return to_route('positions.index')->with('success', 'Poste supprimé.');
    }
}
