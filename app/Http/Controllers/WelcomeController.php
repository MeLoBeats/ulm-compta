<?php

namespace App\Http\Controllers;

use App\Models\Artist;
use App\Models\Label;
use App\Models\Release;
use Inertia\Inertia;
use Inertia\Response;

class WelcomeController extends Controller
{
    public function __invoke(): Response
    {
        $releases = Release::with(['artists', 'label'])
            ->orderByDesc('release_date')
            ->limit(8)
            ->get()
            ->map(fn (Release $release) => [
                'id' => $release->id,
                'title' => $release->title,
                'type' => $release->type->value,
                'release_date' => $release->release_date->format('d/m/Y'),
                'label' => $release->label?->name ?? 'ULM Records',
                'genre' => $release->genre,
                'streaming_url' => $release->streaming_url,
                'cover_path' => $release->cover_path,
                'artists' => $release->artists->pluck('name'),
            ]);

        $artists = Artist::with('label')
            ->orderBy('name')
            ->get()
            ->map(fn (Artist $artist) => [
                'id' => $artist->id,
                'name' => $artist->name,
                'label' => $artist->label?->name ?? 'ULM Records',
                'bio' => $artist->bio,
                'image_path' => $artist->image_path,
            ]);

        $stats = [
            'artists' => Artist::count(),
            'releases' => Release::count(),
            'labels' => Label::count(),
        ];

        return Inertia::render('welcome', [
            'releases' => $releases,
            'artists' => $artists,
            'stats' => $stats,
        ]);
    }
}
