<?php

namespace App\Http\Controllers;

use App\Enums\EntryType;
use App\Models\AccountingEntry;
use App\Models\Employee;
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

        $from = $weekStart->toDateString();
        $to = $weekEnd->toDateString();

        // Revenus auto : ventes de la semaine × $700
        // whereDate extrait uniquement la partie date pour éviter le problème des heures (date cast stocke 'Y-m-d H:i:s')
        $salesRevenue = (float) Sale::whereDate('sale_date', '>=', $from)
            ->whereDate('sale_date', '<=', $to)
            ->sum('quantity') * 700;

        // Frais prestataires avec détail par personne
        $contractorDetails = $this->computeContractorDetails($from, $to);
        $contractorCosts = (float) array_sum(array_column($contractorDetails, 'amount'));

        // Salaires employés actifs (somme fixe hebdo)
        $employeeSalaries = (float) Employee::where('status', 'active')
            ->whereNotNull('weekly_salary')
            ->sum('weekly_salary');

        // Paiements artistes avec détail par artiste
        $artistPaymentDetails = $this->computeArtistPaymentDetails($from, $to);
        $artistPayments = (float) array_sum(array_column($artistPaymentDetails, 'amount'));

        // Entrées manuelles de la semaine
        $entries = AccountingEntry::whereDate('week_start', $from)
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
        $totalDeductible = $contractorCosts + $employeeSalaries + $artistPayments + $manualDeductible;
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
                'employee_salaries' => $employeeSalaries,
                'artist_payments' => $artistPayments,
                'artist_payment_details' => $artistPaymentDetails,
                'contractor_costs' => $contractorCosts,
                'contractor_details' => $contractorDetails,
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

    private function computeContractorDetails(string $from, string $to): array
    {
        $releases = Release::with(['contractors.position'])
            ->whereDate('release_date', '>=', $from)
            ->whereDate('release_date', '<=', $to)
            ->get();

        return $releases
            ->flatMap(fn ($r) => $r->contractors)
            ->groupBy('id')
            ->map(fn ($group) => [
                'name' => $group->first()->name,
                'role' => $group->first()->position?->title ?? '—',
                'releases_count' => $group->count(),
                'amount' => min(
                    $group->count() * (float) $group->first()->fee_per_release,
                    45000.0
                ),
            ])
            ->values()
            ->toArray();
    }

    private function computeArtistPaymentDetails(string $from, string $to): array
    {
        $releases = Release::with(['artists'])
            ->whereHas('sales', fn ($q) => $q->whereDate('sale_date', '>=', $from)->whereDate('sale_date', '<=', $to))
            ->withSum(['sales as weekly_quantity' => fn ($q) => $q->whereDate('sale_date', '>=', $from)->whereDate('sale_date', '<=', $to)], 'quantity')
            ->get();

        // Accumulate raw (uncapped) weekly share per artist across all releases
        $artistTotals = [];

        foreach ($releases as $release) {
            $weeklyGross = (float) ($release->weekly_quantity ?? 0) * 700;

            if ($weeklyGross <= 0 || $release->artists->isEmpty()) {
                continue;
            }

            $grossPerArtist = $weeklyGross / $release->artists->count();

            foreach ($release->artists as $artist) {
                $rawShare = $grossPerArtist * ($artist->contract_type->artistPercentage() / 100);
                $key = $artist->id;

                if (! isset($artistTotals[$key])) {
                    $artistTotals[$key] = ['name' => $artist->name, 'raw' => 0.0];
                }

                $artistTotals[$key]['raw'] += $rawShare;
            }
        }

        // Apply $45k weekly cap once, after accumulating all releases
        return array_values(array_map(fn ($a) => [
            'name' => $a['name'],
            'amount' => min($a['raw'], 45000.0),
        ], $artistTotals));
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
