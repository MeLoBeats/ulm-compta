<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Label;
use App\Models\Position;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('employees/index', [
            'employees' => Employee::with(['position', 'label'])
                ->latest()
                ->get()
                ->map(fn (Employee $employee) => [
                    'id' => $employee->id,
                    'name' => $employee->name,
                    'position' => $employee->position?->title,
                    'label' => $employee->label?->name,
                    'hired_at' => $employee->hired_at->format('d/m/Y'),
                    'fired_at' => $employee->fired_at?->format('d/m/Y'),
                    'weekly_salary' => $employee->weekly_salary,
                    'status' => $employee->status,
                ]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('employees/form', [
            'positions' => Position::where('is_open', true)->get(['id', 'title', 'is_contractor']),
            'labels' => Label::get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'position_id' => 'nullable|exists:positions,id',
            'label_id' => 'nullable|exists:labels,id',
            'hired_at' => 'required|date',
            'weekly_salary' => 'nullable|numeric|min:0',
            'fee_per_release' => 'nullable|numeric|min:0',
            'rib' => 'nullable|string|max:50',
            'phone' => 'nullable|string|max:30',
            'status' => 'required|in:active,inactive',
        ]);

        $validated['position_id'] = $validated['position_id'] ?: null;
        $validated['label_id'] = $validated['label_id'] ?: null;

        Employee::create($validated);

        return to_route('employees.index')->with('success', 'Employé ajouté.');
    }

    public function edit(Employee $employee): Response
    {
        return Inertia::render('employees/form', [
            'employee' => $employee->load(['position', 'label']),
            'positions' => Position::get(['id', 'title', 'is_contractor']),
            'labels' => Label::get(['id', 'name']),
        ]);
    }

    public function update(Request $request, Employee $employee): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'position_id' => 'nullable|exists:positions,id',
            'label_id' => 'nullable|exists:labels,id',
            'hired_at' => 'required|date',
            'fired_at' => 'nullable|date|after_or_equal:hired_at',
            'weekly_salary' => 'nullable|numeric|min:0',
            'fee_per_release' => 'nullable|numeric|min:0',
            'rib' => 'nullable|string|max:50',
            'phone' => 'nullable|string|max:30',
            'status' => 'required|in:active,inactive',
        ]);

        $validated['position_id'] = $validated['position_id'] ?: null;
        $validated['label_id'] = $validated['label_id'] ?: null;

        $employee->update($validated);

        return to_route('employees.index')->with('success', 'Employé mis à jour.');
    }

    public function destroy(Employee $employee): RedirectResponse
    {
        $employee->delete();

        return to_route('employees.index')->with('success', 'Employé supprimé.');
    }
}
