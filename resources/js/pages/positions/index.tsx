import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Postes', href: '/positions' },
];

interface Position {
    id: number;
    title: string;
    description: string | null;
    slots: number;
    weekly_salary: string | null;
    is_open: boolean;
    is_contractor: boolean;
    active_employees_count: number;
}

interface Props {
    positions: Position[];
}

function formatMoney(amount: string | null) {
    if (!amount) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(amount));
}

export default function PositionsIndex({ positions }: Props) {
    const { flash } = usePage<{ flash: { success?: string } }>().props;

    function destroy(id: number) {
        if (confirm('Supprimer ce poste ?')) {
            router.delete(`/positions/${id}`);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Postes — ULM Records" />
            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Postes disponibles</h1>
                        <p className="text-muted-foreground text-sm">{positions.length} poste(s) défini(s)</p>
                    </div>
                    <Button asChild>
                        <Link href="/positions/create">
                            <Plus className="mr-2 h-4 w-4" /> Nouveau poste
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
                                <th className="px-4 py-3 font-medium">Statut</th>
                                <th className="px-4 py-3 font-medium">Places</th>
                                <th className="px-4 py-3 font-medium">Salaire / semaine</th>
                                <th className="px-4 py-3 font-medium">Description</th>
                                <th className="px-4 py-3 font-medium"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {positions.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-muted-foreground px-4 py-8 text-center">
                                        Aucun poste défini.
                                    </td>
                                </tr>
                            )}
                            {positions.map((p) => (
                                <tr key={p.id} className="border-b last:border-0">
                                    <td className="px-4 py-3 font-medium">
                                        {p.title}
                                        {p.is_contractor && (
                                            <Badge variant="outline" className="ml-2 text-xs">Prestataire</Badge>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant={p.is_open ? 'default' : 'secondary'}>
                                            {p.is_open ? 'Ouvert' : 'Fermé'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        {p.active_employees_count} / {p.slots}
                                    </td>
                                    <td className="px-4 py-3">{formatMoney(p.weekly_salary)}</td>
                                    <td className="text-muted-foreground px-4 py-3 max-w-xs truncate">{p.description ?? '—'}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/positions/${p.id}/edit`}>
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => destroy(p.id)}>
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
