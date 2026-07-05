<?php

namespace App\Http\Controllers;

use App\Enums\EntryType;
use App\Models\AccountingEntry;
use App\Models\Employee;
use App\Models\GraphicWork;
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
        // whereDate extrait la partie date pour éviter le problème de stockage 'Y-m-d H:i:s' du cast date
        $salesRevenue = (float) Sale::whereDate('sale_date', '>=', $from)
            ->whereDate('sale_date', '<=', $to)
            ->sum('quantity') * 700;

        // Frais prestataires : releases de la semaine + travaux graphiques, cap $45k/prestataire
        $contractorDetails = $this->computeContractorDetails($from);
        $contractorCosts = (float) array_sum(array_column($contractorDetails, 'amount'));

        // Salaires employés actifs (somme fixe hebdo, toutes semaines)
        $employeeSalaries = (float) Employee::where('status', 'active')
            ->whereNotNull('weekly_salary')
            ->sum('weekly_salary');

        // Paiements artistes avec cap $45k/artiste/semaine
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

        // Travaux graphiques de la semaine (pour affichage)
        $graphicWorksList = GraphicWork::whereDate('week_start', $from)
            ->with(['employee:id,name', 'recorder:id,name,username'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (GraphicWork $gw) => [
                'id' => $gw->id,
                'employee_name' => $gw->employee->name,
                'work_type' => $gw->work_type,
                'quantity' => $gw->quantity,
                'total' => $gw->total,
                'notes' => $gw->notes,
                'recorded_by' => $gw->recorder?->name ?? $gw->recorder?->username,
                'created_at' => $gw->created_at->format('d/m H:i'),
            ]);

        // Prestataires actifs disponibles pour le formulaire travaux graphiques
        $graphistesList = Employee::with('position')
            ->where('status', 'active')
            ->whereHas('position', fn ($q) => $q->where('is_contractor', true))
            ->get()
            ->map(fn (Employee $e) => [
                'id' => $e->id,
                'name' => $e->name,
                'role' => $e->position?->title ?? '—',
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
            'graphicWorks' => $graphicWorksList,
            'graphistes' => $graphistesList,
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

    /**
     * Calcule les frais prestataires de la semaine :
     * releases sorties + travaux graphiques, avec cap $45k par prestataire.
     */
    private function computeContractorDetails(string $weekMonday): array
    {
        $employeeData = [];

        // 1) Fees des releases sorties cette semaine
        $releases = Release::with(['contractors.position'])
            ->whereDate('release_date', $weekMonday)
            ->get();

        foreach ($releases->flatMap(fn ($r) => $r->contractors) as $contractor) {
            $id = $contractor->id;
            if (! isset($employeeData[$id])) {
                $employeeData[$id] = [
                    'name' => $contractor->name,
                    'role' => $contractor->position?->title ?? '—',
                    'releases_count' => 0,
                    'covers_count' => 0,
                    'affiches_count' => 0,
                    'raw' => 0.0,
                ];
            }
            $employeeData[$id]['releases_count']++;
            $employeeData[$id]['raw'] += (float) $contractor->fee_per_release;
        }

        // 2) Travaux graphiques de la semaine
        $graphicWorks = GraphicWork::whereDate('week_start', $weekMonday)
            ->with('employee.position')
            ->get();

        foreach ($graphicWorks as $gw) {
            $id = $gw->employee_id;
            if (! isset($employeeData[$id])) {
                $employeeData[$id] = [
                    'name' => $gw->employee->name,
                    'role' => $gw->employee->position?->title ?? '—',
                    'releases_count' => 0,
                    'covers_count' => 0,
                    'affiches_count' => 0,
                    'raw' => 0.0,
                ];
            }
            $price = GraphicWork::PRICES[$gw->work_type] ?? 0;
            $employeeData[$id][$gw->work_type === 'cover' ? 'covers_count' : 'affiches_count'] += $gw->quantity;
            $employeeData[$id]['raw'] += $gw->quantity * $price;
        }

        // 3) Appliquer le plafond $45k par prestataire
        return array_values(array_map(fn ($e) => [
            'name' => $e['name'],
            'role' => $e['role'],
            'releases_count' => $e['releases_count'],
            'covers_count' => $e['covers_count'],
            'affiches_count' => $e['affiches_count'],
            'amount' => min($e['raw'], 45000.0),
        ], $employeeData));
    }

    /**
     * Calcule les paiements artistes de la semaine avec cap $45k/artiste.
     * Accumule d'abord les parts brutes sur toutes les releases, puis plafonne.
     */
    private function computeArtistPaymentDetails(string $from, string $to): array
    {
        $releases = Release::with(['artists'])
            ->whereHas('sales', fn ($q) => $q->whereDate('sale_date', '>=', $from)->whereDate('sale_date', '<=', $to))
            ->withSum(['sales as weekly_quantity' => fn ($q) => $q->whereDate('sale_date', '>=', $from)->whereDate('sale_date', '<=', $to)], 'quantity')
            ->get();

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
