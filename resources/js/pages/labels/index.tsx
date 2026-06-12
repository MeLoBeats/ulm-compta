import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Labels', href: '/labels' },
];

interface Label {
    id: number;
    name: string;
    description: string | null;
    director: { name: string } | null;
    founded_at: string | null;
    employees_count: number;
    artists_count: number;
    releases_count: number;
}

interface Props {
    labels: Label[];
}

export default function LabelsIndex({ labels }: Props) {
    const { flash } = usePage<{ flash: { success?: string } }>().props;

    function destroy(id: number) {
        if (confirm('Supprimer ce label ? Ses artistes et sorties ne seront pas supprimés.')) {
            router.delete(`/labels/${id}`);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Labels — ULM Records" />
            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Labels</h1>
                        <p className="text-muted-foreground text-sm">{labels.length} label(s) sous ULM Records</p>
                    </div>
                    <Button asChild>
                        <Link href="/labels/create">
                            <Plus className="mr-2 h-4 w-4" /> Nouveau label
                        </Link>
                    </Button>
                </div>

                {flash?.success && (
                    <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        {flash.success}
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {labels.length === 0 && (
                        <p className="text-muted-foreground col-span-full text-center py-8">Aucun label créé.</p>
                    )}
                    {labels.map((l) => (
                        <div key={l.id} className="rounded-xl border p-5 flex flex-col gap-3">
                            <div>
                                <h2 className="text-lg font-semibold">{l.name}</h2>
                                {l.description && (
                                    <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{l.description}</p>
                                )}
                            </div>
                            <div className="text-sm space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Directeur</span>
                                    <span>{l.director?.name ?? '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Salariés</span>
                                    <span>{l.employees_count}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Artistes</span>
                                    <span>{l.artists_count}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Sorties</span>
                                    <span>{l.releases_count}</span>
                                </div>
                                {l.founded_at && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Fondé le</span>
                                        <span>{l.founded_at}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2 pt-1">
                                <Button variant="outline" size="sm" asChild className="flex-1">
                                    <Link href={`/labels/${l.id}`}>
                                        <Eye className="mr-1 h-3.5 w-3.5" /> Voir
                                    </Link>
                                </Button>
                                <Button variant="ghost" size="icon" asChild>
                                    <Link href={`/labels/${l.id}/edit`}>
                                        <Pencil className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => destroy(l.id)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
