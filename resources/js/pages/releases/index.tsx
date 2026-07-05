import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronDown, ChevronUp, Eye, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Sorties', href: '/releases' },
];

interface Release {
    id: number;
    title: string;
    type: string;
    release_date: string;
    release_date_raw: string;
    label: string;
    artists: string[];
    total_sales: number;
    gross_revenue: number;
    genre: string | null;
    streaming_url: string | null;
    cover_path: string | null;
}

interface Filters {
    sort: string;
    direction: string;
    artist: string;
    type: string;
    week: string;
    release_week: string;
    release_year: string;
}

function isoWeekRange(week: number, year: number): string {
    const jan4 = new Date(year, 0, 4);
    const dow = (jan4.getDay() + 6) % 7;
    const monday = new Date(jan4);
    monday.setDate(jan4.getDate() - dow + (week - 1) * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    return `${fmt(monday)} – ${fmt(sunday)}`;
}

interface Props {
    releases: Release[];
    filters: Filters;
}

function formatMoney(amount: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

export default function ReleasesIndex({ releases, filters }: Props) {
    const { flash } = usePage<{ flash: { success?: string } }>().props;

    const [artistInput, setArtistInput] = useState(filters.artist);
    const [typeInput, setTypeInput] = useState(filters.type || 'all');
    const [weekInput, setWeekInput] = useState(filters.week);
    const [releaseWeekInput, setReleaseWeekInput] = useState(filters.release_week);
    const [releaseYearInput, setReleaseYearInput] = useState(filters.release_year || String(new Date().getFullYear()));

    const hasFilters =
        filters.artist || (filters.type && filters.type !== 'all') || filters.week || filters.release_week;

    const releaseWeekNum = parseInt(releaseWeekInput);
    const releaseYearNum = parseInt(releaseYearInput);
    const releaseWeekHint =
        releaseWeekInput && !isNaN(releaseWeekNum) && releaseWeekNum >= 1 && releaseWeekNum <= 53
            ? isoWeekRange(releaseWeekNum, isNaN(releaseYearNum) ? new Date().getFullYear() : releaseYearNum)
            : null;

    function applyWithValues(
        overrides: Partial<{
            sort: string;
            direction: string;
            artist: string;
            type: string;
            week: string;
            release_week: string;
            release_year: string;
        }> = {},
    ) {
        const merged = {
            sort: filters.sort,
            direction: filters.direction,
            artist: artistInput,
            type: typeInput === 'all' ? '' : typeInput,
            week: weekInput,
            release_week: releaseWeekInput,
            release_year: releaseYearInput,
            ...overrides,
        };
        const params: Record<string, string> = {};
        if (merged.artist) params.artist = merged.artist;
        if (merged.type && merged.type !== 'all') params.type = merged.type;
        if (merged.week) params.week = merged.week;
        if (merged.release_week) {
            params.release_week = merged.release_week;
            params.release_year = merged.release_year;
        }
        if (merged.sort !== 'release_date' || merged.direction !== 'desc') {
            params.sort = merged.sort;
            params.direction = merged.direction;
        }
        router.get('/releases', params, { replace: true });
    }

    function sortBy(column: string) {
        const newDirection = filters.sort === column && filters.direction === 'desc' ? 'asc' : 'desc';
        applyWithValues({ sort: column, direction: newDirection });
    }

    function clearFilters() {
        setArtistInput('');
        setTypeInput('all');
        setWeekInput('');
        setReleaseWeekInput('');
        setReleaseYearInput(String(new Date().getFullYear()));
        router.get('/releases');
    }

    function destroy(id: number) {
        if (confirm('Supprimer cette sortie et toutes ses ventes ?')) {
            router.delete(`/releases/${id}`);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sorties musicales — ULM Records" />
            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Sorties musicales</h1>
                        <p className="text-muted-foreground text-sm">{releases.length} sortie(s)</p>
                    </div>
                    <Button asChild>
                        <Link href="/releases/create">
                            <Plus className="mr-2 h-4 w-4" /> Nouvelle sortie
                        </Link>
                    </Button>
                </div>

                {flash?.success && (
                    <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        {flash.success}
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-wrap items-end gap-3">
                    <div className="grid gap-1">
                        <label className="text-muted-foreground text-xs">Artiste</label>
                        <Input
                            value={artistInput}
                            onChange={(e) => setArtistInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyWithValues({ artist: artistInput })}
                            placeholder="Chercher un artiste..."
                            className="h-8 w-48 text-sm"
                        />
                    </div>

                    <div className="grid gap-1">
                        <label className="text-muted-foreground text-xs">Type</label>
                        <Select
                            value={typeInput}
                            onValueChange={(v) => {
                                setTypeInput(v);
                                applyWithValues({ type: v === 'all' ? '' : v });
                            }}
                        >
                            <SelectTrigger className="h-8 w-28 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous</SelectItem>
                                <SelectItem value="Single">Single</SelectItem>
                                <SelectItem value="EP">EP</SelectItem>
                                <SelectItem value="Album">Album</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-1">
                        <label className="text-muted-foreground text-xs">Semaine (ventes)</label>
                        <Input
                            type="date"
                            value={weekInput}
                            onChange={(e) => {
                                setWeekInput(e.target.value);
                                applyWithValues({ week: e.target.value });
                            }}
                            className="h-8 w-40 text-sm"
                        />
                    </div>

                    <div className="grid gap-1">
                        <label className="text-muted-foreground text-xs">
                            Semaine de sortie
                            {releaseWeekHint && (
                                <span className="text-muted-foreground/70 ml-1">({releaseWeekHint})</span>
                            )}
                        </label>
                        <div className="flex gap-1">
                            <Input
                                type="number"
                                min={1}
                                max={53}
                                value={releaseWeekInput}
                                onChange={(e) => setReleaseWeekInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyWithValues()}
                                placeholder="N° sem."
                                className="h-8 w-20 text-sm"
                            />
                            <Input
                                type="number"
                                min={2020}
                                max={2099}
                                value={releaseYearInput}
                                onChange={(e) => setReleaseYearInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyWithValues()}
                                placeholder="Année"
                                className="h-8 w-20 text-sm"
                            />
                        </div>
                    </div>

                    <Button size="sm" onClick={() => applyWithValues()}>
                        Filtrer
                    </Button>

                    {hasFilters && (
                        <Button size="sm" variant="ghost" onClick={clearFilters}>
                            <X className="mr-1 h-3.5 w-3.5" /> Effacer
                        </Button>
                    )}
                </div>

                {/* Table */}
                <div className="rounded-xl border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-muted-foreground border-b text-left">
                                <SortHeader column="title" label="Titre" filters={filters} onSort={sortBy} />
                                <th className="px-4 py-3 font-medium">Type</th>
                                <th className="px-4 py-3 font-medium">Artiste(s)</th>
                                <th className="px-4 py-3 font-medium">Label</th>
                                <SortHeader column="release_date" label="Date" filters={filters} onSort={sortBy} />
                                <SortHeader column="total_sales" label="Ventes" filters={filters} onSort={sortBy} right />
                                <th className="px-4 py-3 text-right font-medium">Revenus bruts</th>
                                <th className="px-4 py-3 font-medium"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {releases.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-muted-foreground px-4 py-8 text-center">
                                        Aucune sortie trouvée.
                                    </td>
                                </tr>
                            )}
                            {releases.map((r) => (
                                <tr key={r.id} className="border-b last:border-0">
                                    <td className="px-4 py-3 font-medium">
                                        <Link href={`/releases/${r.id}`} className="hover:underline">
                                            {r.title}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant="outline">{r.type}</Badge>
                                    </td>
                                    <td className="px-4 py-3">{r.artists.join(', ')}</td>
                                    <td className="px-4 py-3">{r.label}</td>
                                    <td className="px-4 py-3">{r.release_date}</td>
                                    <td className="px-4 py-3 text-right">{r.total_sales}</td>
                                    <td className="px-4 py-3 text-right font-medium">{formatMoney(r.gross_revenue)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/releases/${r.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/releases/${r.id}/edit`}>
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => destroy(r.id)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}

function SortHeader({
    column,
    label,
    filters,
    onSort,
    right,
}: {
    column: string;
    label: string;
    filters: Filters;
    onSort: (col: string) => void;
    right?: boolean;
}) {
    const active = filters.sort === column;
    return (
        <th
            className={`cursor-pointer select-none px-4 py-3 font-medium hover:text-foreground ${right ? 'text-right' : ''}`}
            onClick={() => onSort(column)}
        >
            <span className="inline-flex items-center gap-1">
                {label}
                {active ? (
                    filters.direction === 'asc' ? (
                        <ChevronUp className="h-3 w-3" />
                    ) : (
                        <ChevronDown className="h-3 w-3" />
                    )
                ) : (
                    <ChevronDown className="h-3 w-3 opacity-25" />
                )}
            </span>
        </th>
    );
}
