import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Sorties', href: '/releases' },
];

interface Release {
    id: number;
    title: string;
    type: string;
    release_date: string;
    label: string;
    artists: string[];
    total_sales: number;
    gross_revenue: number;
    genre: string | null;
    streaming_url: string | null;
    cover_path: string | null;
}

interface Props {
    releases: Release[];
}

function formatMoney(amount: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

export default function ReleasesIndex({ releases }: Props) {
    const { flash } = usePage<{ flash: { success?: string } }>().props;

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

                <div className="rounded-xl border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-muted-foreground border-b text-left">
                                <th className="px-4 py-3 font-medium">Titre</th>
                                <th className="px-4 py-3 font-medium">Type</th>
                                <th className="px-4 py-3 font-medium">Artiste(s)</th>
                                <th className="px-4 py-3 font-medium">Label</th>
                                <th className="px-4 py-3 font-medium">Date</th>
                                <th className="px-4 py-3 text-right font-medium">Ventes</th>
                                <th className="px-4 py-3 text-right font-medium">Revenus bruts</th>
                                <th className="px-4 py-3 font-medium"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {releases.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-muted-foreground px-4 py-8 text-center">
                                        Aucune sortie enregistrée.
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
