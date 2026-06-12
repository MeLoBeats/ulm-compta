import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Salariés', href: '/employees' },
];

interface Employee {
    id: number;
    name: string;
    position: string | null;
    label: string | null;
    hired_at: string;
    fired_at: string | null;
    weekly_salary: string | null;
    status: string;
}

interface Props {
    employees: Employee[];
}

function formatMoney(amount: string | null) {
    if (!amount) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(amount));
}

export default function EmployeesIndex({ employees }: Props) {
    const { flash } = usePage<{ flash: { success?: string } }>().props;

    function destroy(id: number) {
        if (confirm('Supprimer cet employé ?')) {
            router.delete(`/employees/${id}`);
        }
    }

    const active = employees.filter((e) => e.status === 'active');
    const inactive = employees.filter((e) => e.status !== 'active');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Salariés — ULM Records" />
            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Salariés</h1>
                        <p className="text-muted-foreground text-sm">
                            {active.length} actif(s) · {inactive.length} inactif(s)
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/employees/create">
                            <Plus className="mr-2 h-4 w-4" /> Ajouter un salarié
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
                                <th className="px-4 py-3 font-medium">Nom</th>
                                <th className="px-4 py-3 font-medium">Poste</th>
                                <th className="px-4 py-3 font-medium">Label</th>
                                <th className="px-4 py-3 font-medium">Embauché le</th>
                                <th className="px-4 py-3 font-medium">Salaire / sem.</th>
                                <th className="px-4 py-3 font-medium">Statut</th>
                                <th className="px-4 py-3 font-medium"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-muted-foreground px-4 py-8 text-center">
                                        Aucun salarié enregistré.
                                    </td>
                                </tr>
                            )}
                            {employees.map((e) => (
                                <tr key={e.id} className="border-b last:border-0">
                                    <td className="px-4 py-3 font-medium">{e.name}</td>
                                    <td className="px-4 py-3">{e.position ?? '—'}</td>
                                    <td className="px-4 py-3">{e.label ?? 'ULM Records'}</td>
                                    <td className="px-4 py-3">{e.hired_at}</td>
                                    <td className="px-4 py-3">{formatMoney(e.weekly_salary)}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={e.status === 'active' ? 'default' : 'secondary'}>
                                            {e.status === 'active' ? 'Actif' : 'Inactif'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/employees/${e.id}/edit`}>
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => destroy(e.id)}>
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
