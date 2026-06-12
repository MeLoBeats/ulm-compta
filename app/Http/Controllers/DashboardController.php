<?php

namespace App\Http\Controllers;

use App\Models\Artist;
use App\Models\Employee;
use App\Models\Label;
use App\Models\Release;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('dashboard', [
            'stats' => [
                'employees' => Employee::where('status', 'active')->count(),
                'labels' => Label::count(),
                'artists' => Artist::count(),
                'releases' => Release::count(),
            ],
            'recentReleases' => Release::with(['artists', 'label'])
                ->latest('release_date')
                ->limit(5)
                ->get()
                ->map(fn (Release $release) => [
                    'id' => $release->id,
                    'title' => $release->title,
                    'type' => $release->type,
                    'release_date' => $release->release_date->format('d/m/Y'),
                    'label' => $release->label?->name ?? 'ULM Records',
                    'artists' => $release->artists->pluck('name'),
                    'total_sales' => $release->total_sales,
                    'gross_revenue' => $release->gross_revenue,
                ]),
        ]);
    }
}
