<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Label;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class LabelController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('labels/index', [
            'labels' => Label::with(['director', 'artists', 'releases'])
                ->withCount(['employees', 'artists', 'releases'])
                ->latest()
                ->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('labels/form', [
            'employees' => Employee::where('status', 'active')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'director_employee_id' => 'nullable|exists:employees,id',
            'founded_at' => 'nullable|date',
            'logo' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('logo')) {
            $validated['logo_path'] = $request->file('logo')->store('logos', 'public');
        }

        $validated['director_employee_id'] = $validated['director_employee_id'] ?: null;
        unset($validated['logo']);
        Label::create($validated);

        return to_route('labels.index')->with('success', 'Label créé avec succès.');
    }

    public function show(Label $label): Response
    {
        return Inertia::render('labels/show', [
            'label' => $label->load(['director', 'employees.position', 'artists', 'releases.artists']),
        ]);
    }

    public function edit(Label $label): Response
    {
        return Inertia::render('labels/form', [
            'label' => $label,
            'employees' => Employee::where('status', 'active')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, Label $label): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'director_employee_id' => 'nullable|exists:employees,id',
            'founded_at' => 'nullable|date',
            'logo' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('logo')) {
            if ($label->logo_path) {
                Storage::disk('public')->delete($label->logo_path);
            }
            $validated['logo_path'] = $request->file('logo')->store('logos', 'public');
        }

        $validated['director_employee_id'] = $validated['director_employee_id'] ?: null;
        unset($validated['logo']);
        $label->update($validated);

        return to_route('labels.index')->with('success', 'Label mis à jour.');
    }

    public function destroy(Label $label): RedirectResponse
    {
        if ($label->logo_path) {
            Storage::disk('public')->delete($label->logo_path);
        }

        $label->delete();

        return to_route('labels.index')->with('success', 'Label supprimé.');
    }
}
