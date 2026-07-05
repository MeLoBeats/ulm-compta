<?php

namespace App\Http\Controllers;

use App\Models\GraphicWork;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class GraphicWorkController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'week_start' => 'required|date',
            'employee_id' => 'required|exists:employees,id',
            'work_type' => 'required|in:cover,affiche',
            'quantity' => 'required|integer|min:1|max:500',
            'notes' => 'nullable|string|max:500',
        ]);

        GraphicWork::create([
            ...$validated,
            'recorded_by' => $request->user()->id,
        ]);

        return redirect()->route('accounting.index', ['week' => $validated['week_start']])
            ->with('success', 'Travail graphique enregistré.');
    }

    public function destroy(GraphicWork $graphicWork): RedirectResponse
    {
        $weekStart = $graphicWork->week_start->toDateString();
        $graphicWork->delete();

        return redirect()->route('accounting.index', ['week' => $weekStart])
            ->with('success', 'Travail graphique supprimé.');
    }
}
