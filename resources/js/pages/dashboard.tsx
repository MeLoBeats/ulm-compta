import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Disc3, Music, Tag, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

interface RecentRelease {
    id: number;
    title: string;
    type: string;
    release_date: string;
    label: string;
    artists: string[];
    total_sales: number;
    gross_revenue: number;
}

interface Props {
    stats: {
        employees: number;
        labels: number;
        artists: number;
        releases: number;
    };
    recentReleases: RecentRelease[];
}

function formatMoney(amount: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

export default function Dashboard({ stats, recentReleases }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard — ULM Records" />
            <div className="flex flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold">ULM Records</h1>
                    <p className="text-muted-foreground text-sm">Vue d'ensemble de votre maison de disque</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard icon={Users} label="Salariés actifs" value={stats.employees} href="/employees" />
                    <StatCard icon={Tag} label="Labels" value={stats.labels} href="/labels" />
                    <StatCard icon={Music} label="Artistes" value={stats.artists} href="/artists" />
                    <StatCard icon={Disc3} label="Sorties" value={stats.releases} href="/releases" />
                </div>

                <div className="rounded-xl border p-4">
                    <h2 className="mb-4 font-semibold">Sorties récentes</h2>
                    {recentReleases.length === 0 ? (
                        <p className="text-muted-foreground text-sm">Aucune sortie pour l'instant.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-muted-foreground border-b text-left">
                                        <th className="pb-2 font-medium">Titre</th>
                                        <th className="pb-2 font-medium">Type</th>
                                        <th className="pb-2 font-medium">Artiste(s)</th>
                                        <th className="pb-2 font-medium">Label</th>
                                        <th className="pb-2 font-medium">Date</th>
                                        <th className="pb-2 text-right font-medium">Ventes</th>
                                        <th className="pb-2 text-right font-medium">Revenus bruts</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentReleases.map((r) => (
                                        <tr key={r.id} className="border-b last:border-0">
                                            <td className="py-2">
                                                <Link href={`/releases/${r.id}`} className="hover:underline font-medium">
                                                    {r.title}
                                                </Link>
                                            </td>
                                            <td className="py-2">{r.type}</td>
                                            <td className="py-2">{r.artists.join(', ')}</td>
                                            <td className="py-2">{r.label}</td>
                                            <td className="py-2">{r.release_date}</td>
                                            <td className="py-2 text-right">{r.total_sales}</td>
                                            <td className="py-2 text-right">{formatMoney(r.gross_revenue)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
    href,
}: {
    icon: React.ElementType;
    label: string;
    value: number;
    href: string;
}) {
    return (
        <Link href={href} className="rounded-xl border p-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900">
            <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-lg p-2">
                    <Icon className="text-primary h-5 w-5" />
                </div>
                <div>
                    <p className="text-muted-foreground text-xs">{label}</p>
                    <p className="text-2xl font-bold">{value}</p>
                </div>
            </div>
        </Link>
    );
}
