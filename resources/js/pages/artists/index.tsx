import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Artistes', href: '/artists' },
];

interface Artist {
    id: number;
    name: string;
    label: string;
    contract_type: string;
    releases_count: number;
    image_path: string | null;
}

interface Props {
    artists: Artist[];
}

export default function ArtistsIndex({ artists }: Props) {
    const { flash } = usePage<{ flash: { success?: string } }>().props;

    function destroy(id: number) {
        if (confirm('Supprimer cet artiste ?')) {
            router.delete(`/artists/${id}`);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Artistes — ULM Records" />
            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Artistes</h1>
                        <p className="text-muted-foreground text-sm">{artists.length} artiste(s) signé(s)</p>
                    </div>
                    <Button asChild>
                        <Link href="/artists/create">
                            <Plus className="mr-2 h-4 w-4" /> Ajouter un artiste
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
                                <th className="px-4 py-3 font-medium">Artiste</th>
                                <th className="px-4 py-3 font-medium">Label</th>
                                <th className="px-4 py-3 font-medium">Contrat</th>
                                <th className="px-4 py-3 font-medium">Sorties</th>
                                <th className="px-4 py-3 font-medium"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {artists.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-muted-foreground px-4 py-8 text-center">
                                        Aucun artiste signé.
                                    </td>
                                </tr>
                            )}
                            {artists.map((a) => (
                                <tr key={a.id} className="border-b last:border-0">
                                    <td className="px-4 py-3 font-medium">
                                        <Link href={`/artists/${a.id}`} className="hover:underline">
                                            {a.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">{a.label}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant="outline">{a.contract_type}</Badge>
                                    </td>
                                    <td className="px-4 py-3">{a.releases_count}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/artists/${a.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/artists/${a.id}/edit`}>
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => destroy(a.id)}>
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
