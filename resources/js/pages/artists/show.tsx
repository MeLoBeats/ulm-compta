import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ArtistDetail {
    id: number;
    name: string;
    label: string;
    contract_type: string;
    artist_percentage: number;
    label_percentage: number;
    bio: string | null;
    image_path: string | null;
    releases_this_week: number;
    releases: Array<{
        id: number;
        title: string;
        type: string;
        release_date: string;
        total_sales: number;
        gross_revenue: number;
    }>;
    total_sales: number;
    gross_revenue: number;
    artist_earnings: number;
    label_earnings: number;
    surplus: number;
}

interface Props {
    artist: ArtistDetail;
}

function formatMoney(amount: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

export default function ArtistShow({ artist }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Artistes', href: '/artists' },
        { title: artist.name, href: `/artists/${artist.id}` },
    ];

    const weeklyLimitReached = artist.releases_this_week >= 3;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${artist.name} — ULM Records`} />
            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{artist.name}</h1>
                        <div className="text-muted-foreground mt-1 flex flex-wrap gap-3 text-sm">
                            <span>{artist.label}</span>
                            <Badge variant="outline">{artist.contract_type}</Badge>
                            <span>Label {artist.label_percentage}% · Artiste {artist.artist_percentage}%</span>
                        </div>
                        {artist.bio && <p className="text-muted-foreground mt-2 text-sm">{artist.bio}</p>}
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={`/artists/${artist.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" /> Modifier
                        </Link>
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Sorties cette semaine :</span>
                    <Badge variant={weeklyLimitReached ? 'destructive' : 'default'}>
                        {artist.releases_this_week} / 3
                    </Badge>
                    {weeklyLimitReached && (
                        <span className="text-xs text-red-500">Quota hebdomadaire atteint</span>
                    )}
                </div>

                {/* Accounting summary */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MoneyCard label="Ventes totales" value={`${artist.total_sales} vente(s)`} />
                    <MoneyCard label="Revenus bruts" value={formatMoney(artist.gross_revenue)} />
                    <MoneyCard label="Part artiste" value={formatMoney(artist.artist_earnings)} highlight />
                    <MoneyCard label="Part label" value={formatMoney(artist.label_earnings)} />
                </div>

                {artist.surplus > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                        Plafond de $45,000 atteint — surplus de {formatMoney(artist.surplus)} reversé au label
                    </div>
                )}

                {/* Releases */}
                <div className="rounded-xl border p-5">
                    <h2 className="mb-4 font-semibold">Sorties ({artist.releases.length})</h2>
                    {artist.releases.length === 0 ? (
                        <p className="text-muted-foreground text-sm">Aucune sortie.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-muted-foreground border-b text-left">
                                    <th className="pb-2 font-medium">Titre</th>
                                    <th className="pb-2 font-medium">Type</th>
                                    <th className="pb-2 font-medium">Date</th>
                                    <th className="pb-2 text-right font-medium">Ventes</th>
                                    <th className="pb-2 text-right font-medium">Revenus bruts</th>
                                </tr>
                            </thead>
                            <tbody>
                                {artist.releases.map((r) => (
                                    <tr key={r.id} className="border-b last:border-0">
                                        <td className="py-2">
                                            <Link href={`/releases/${r.id}`} className="hover:underline font-medium">
                                                {r.title}
                                            </Link>
                                        </td>
                                        <td className="py-2">{r.type}</td>
                                        <td className="py-2">{r.release_date}</td>
                                        <td className="py-2 text-right">{r.total_sales}</td>
                                        <td className="py-2 text-right">{formatMoney(r.gross_revenue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

function MoneyCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className={`rounded-xl border p-4 ${highlight ? 'border-primary/30 bg-primary/5' : ''}`}>
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="mt-1 text-xl font-bold">{value}</p>
        </div>
    );
}
