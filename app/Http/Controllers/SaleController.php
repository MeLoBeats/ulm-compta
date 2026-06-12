<?php

namespace App\Http\Controllers;

use App\Models\Release;
use App\Models\Sale;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SaleController extends Controller
{
    public function store(Request $request, Release $release): RedirectResponse
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
            'sale_date' => 'required|date',
            'notes' => 'nullable|string|max:500',
        ]);

        $release->sales()->create([
            ...$validated,
            'recorded_by' => $request->user()->id,
        ]);

        return to_route('releases.show', $release)->with('success', 'Ventes enregistrées.');
    }

    public function destroy(Release $release, Sale $sale): RedirectResponse
    {
        $sale->delete();

        return to_route('releases.show', $release)->with('success', 'Entrée de vente supprimée.');
    }
}
