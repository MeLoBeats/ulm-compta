import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface LabelDetail {
    id: number;
    name: string;
    description: string | null;
    founded_at: string | null;
    director: { id: number; name: string } | null;
    employees: Array<{ id: number; name: string; position: { title: string } | null; status: string }>;
    artists: Array<{ id: number; name: string; contract_type: string }>;
    releases: Array<{ id: number; title: string; type: string; release_date: string; artists: Array<{ name: string }> }>;
}

interface Props {
    label: LabelDetail;
}

export default function LabelShow({ label }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Labels', href: '/labels' },
        { title: label.name, href: `/labels/${label.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${label.name} — ULM Records`} />
            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{label.name}</h1>
                        {label.description && <p className="text-muted-foreground mt-1 text-sm">{label.description}</p>}
                        <div className="text-muted-foreground mt-2 flex gap-4 text-sm">
                            {label.director && <span>Directeur : <strong>{label.director.name}</strong></span>}
                            {label.founded_at && <span>Fondé le {label.founded_at}</span>}
                        </div>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={`/labels/${label.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" /> Modifier
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Section title={`Salariés (${label.employees.length})`}>
                        {label.employees.length === 0 ? (
                            <p className="text-muted-foreground text-sm">Aucun salarié dans ce label.</p>
                        ) : (
                            <ul className="space-y-2">
                                {label.employees.map((e) => (
                                    <li key={e.id} className="flex items-center justify-between text-sm">
                                        <Link href={`/employees/${e.id}/edit`} className="font-medium hover:underline">
                                            {e.name}
                                        </Link>
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">{e.position?.title ?? '—'}</span>
                                            <Badge variant={e.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                                {e.status === 'active' ? 'Actif' : 'Inactif'}
                                            </Badge>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Section>

                    <Section title={`Artistes (${label.artists.length})`}>
                        {label.artists.length === 0 ? (
                            <p className="text-muted-foreground text-sm">Aucun artiste signé.</p>
                        ) : (
                            <ul className="space-y-2">
                                {label.artists.map((a) => (
                                    <li key={a.id} className="flex items-center justify-between text-sm">
                                        <Link href={`/artists/${a.id}`} className="font-medium hover:underline">
                                            {a.name}
                                        </Link>
                                        <span className="text-muted-foreground">{a.contract_type}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Section>
                </div>

                <Section title={`Sorties (${label.releases.length})`}>
                    {label.releases.length === 0 ? (
                        <p className="text-muted-foreground text-sm">Aucune sortie pour ce label.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-muted-foreground border-b text-left">
                                        <th className="pb-2 font-medium">Titre</th>
                                        <th className="pb-2 font-medium">Type</th>
                                        <th className="pb-2 font-medium">Artiste(s)</th>
                                        <th className="pb-2 font-medium">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {label.releases.map((r) => (
                                        <tr key={r.id} className="border-b last:border-0">
                                            <td className="py-2">
                                                <Link href={`/releases/${r.id}`} className="hover:underline font-medium">
                                                    {r.title}
                                                </Link>
                                            </td>
                                            <td className="py-2">{r.type}</td>
                                            <td className="py-2">{r.artists.map((a) => a.name).join(', ')}</td>
                                            <td className="py-2">{r.release_date}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Section>
            </div>
        </AppLayout>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border p-5">
            <h2 className="mb-4 font-semibold">{title}</h2>
            {children}
        </div>
    );
}
