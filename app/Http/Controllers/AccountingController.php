<?php

namespace App\Http\Controllers;

use App\Enums\EntryType;
use App\Models\AccountingEntry;
use App\Models\Release;
use App\Models\Sale;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccountingController extends Controller
{
    public function index(Request $request): Response
    {
        $weekStart = $request->filled('week')
            ? Carbon::parse($request->input('week'))->startOfWeek(Carbon::MONDAY)->startOfDay()
            : Carbon::now()->startOfWeek(Carbon::MONDAY)->startOfDay();

        $weekEnd = $weekStart->copy()->endOfWeek(Carbon::SUNDAY)->endOfDay();

        // Revenus auto : ventes de la semaine × $700
        $salesRevenue = (float) Sale::whereBetween('sale_date', [$weekStart->toDateString(), $weekEnd->toDateString()])
            ->sum('quantity') * 700;

        // Frais prestataires auto : sorties de la semaine × leur tarif
        $contractorCosts = (float) Release::with('contractors')
            ->whereBetween('release_date', [$weekStart->toDateString(), $weekEnd->toDateString()])
            ->get()
            ->flatMap(fn ($r) => $r->contractors)
            ->sum('fee_per_release');

        // Entrées manuelles de la semaine
        $entries = AccountingEntry::whereDate('week_start', $weekStart->toDateString())
            ->with('recorder:id,name,username')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (AccountingEntry $e) => [
                'id' => $e->id,
                'type' => $e->type->value,
                'category' => $e->category,
                'category_label' => $e->categoryLabel(),
                'amount' => (float) $e->amount,
                'label' => $e->label,
                'notes' => $e->notes,
                'recorded_by' => $e->recorder?->name ?? $e->recorder?->username,
                'created_at' => $e->created_at->format('d/m H:i'),
            ]);

        $manualRevenue = $entries->where('type', 'revenue')->sum('amount');
        $manualDeductible = $entries->where('type', 'deductible_expense')->sum('amount');
        $manualNonDeductible = $entries->where('type', 'non_deductible_expense')->sum('amount');

        $totalRevenue = $salesRevenue + $manualRevenue;
        $totalDeductible = $contractorCosts + $manualDeductible;
        $totalNonDeductible = $manualNonDeductible;
        $netResult = $totalRevenue - $totalDeductible - $totalNonDeductible;
        $taxableIncome = $totalRevenue - $totalDeductible;

        return Inertia::render('accounting/index', [
            'weekStart' => $weekStart->toDateString(),
            'weekEnd' => $weekEnd->toDateString(),
            'weekLabel' => 'Semaine du '.$weekStart->translatedFormat('d M').' au '.$weekEnd->translatedFormat('d M Y'),
            'prevWeek' => $weekStart->copy()->subWeek()->toDateString(),
            'nextWeek' => $weekStart->copy()->addWeek()->toDateString(),
            'isCurrentWeek' => $weekStart->isSameWeek(Carbon::now()),
            'auto' => [
                'sales_revenue' => $salesRevenue,
                'contractor_costs' => $contractorCosts,
            ],
            'entries' => $entries->values(),
            'totals' => [
                'revenue' => $totalRevenue,
                'deductible' => $totalDeductible,
                'non_deductible' => $totalNonDeductible,
                'net_result' => $netResult,
                'taxable_income' => $taxableIncome,
            ],
            'categories' => [
                'revenue' => EntryType::Revenue->categories(),
                'deductible_expense' => EntryType::DeductibleExpense->categories(),
                'non_deductible_expense' => EntryType::NonDeductibleExpense->categories(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'week_start' => 'required|date',
            'type' => 'required|in:revenue,deductible_expense,non_deductible_expense',
            'category' => ['required', 'string', 'in:'.implode(',', EntryType::allCategoryKeys())],
            'amount' => 'required|numeric|min:0.01',
            'label' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);

        AccountingEntry::create([
            ...$validated,
            'recorded_by' => $request->user()->id,
        ]);

        return redirect()->route('accounting.index', ['week' => $validated['week_start']])
            ->with('success', 'Entrée ajoutée.');
    }

    public function destroy(AccountingEntry $accountingEntry): RedirectResponse
    {
        $weekStart = $accountingEntry->week_start->toDateString();
        $accountingEntry->delete();

        return redirect()->route('accounting.index', ['week' => $weekStart])
            ->with('success', 'Entrée supprimée.');
    }
}
