import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ExternalLink, LoaderCircle, Pencil, Trash2 } from 'lucide-react';
import { FormEventHandler } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import InputError from '@/components/input-error';
import { router } from '@inertiajs/react';

interface AccountingRow {
    artist_name: string;
    artist_earnings: number;
    label_earnings: number;
    surplus: number;
}

interface SaleEntry {
    id: number;
    quantity: number;
    revenue: number;
    sale_date: string;
    notes: string | null;
    recorded_by: string;
}

interface ContractorRow {
    id: number;
    name: string;
    role: string;
    fee_per_release: number;
    weekly_total: number;
    is_capped: boolean;
}

interface ReleaseDetail {
    id: number;
    title: string;
    type: string;
    release_date: string;
    label: string;
    genre: string | null;
    streaming_url: string | null;
    cover_path: string | null;
    artists: Array<{ id: number; name: string; contract_type: string }>;
    contractors: ContractorRow[];
    total_contractor_cost: number;
    total_sales: number;
    gross_revenue: number;
    accounting: AccountingRow[];
    total_artist_earnings: number;
    total_label_earnings: number;
    sales: SaleEntry[];
}

interface Props {
    release: ReleaseDetail;
}

function formatMoney(amount: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

export default function ReleaseShow({ release }: Props) {
    const { flash } = usePage<{ flash: { success?: string } }>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Sorties', href: '/releases' },
        { title: release.title, href: `/releases/${release.id}` },
    ];

    const { data, setData, post, processing, errors, reset } = useForm({
        quantity: '',
        sale_date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const submitSale: FormEventHandler = (e) => {
        e.preventDefault();
        post(`/releases/${release.id}/sales`, { onSuccess: () => reset() });
    };

    function deleteSale(saleId: number) {
        if (confirm('Supprimer cette entrée de vente ?')) {
            router.delete(`/releases/${release.id}/sales/${saleId}`);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${release.title} — ULM Records`} />
            <div className="flex flex-1 flex-col gap-6 p-6">
                {flash?.success && (
                    <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        {flash.success}
                    </div>
                )}

                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold">{release.title}</h1>
                            <Badge variant="outline">{release.type}</Badge>
                        </div>
                        <div className="text-muted-foreground mt-1 flex flex-wrap gap-3 text-sm">
                            <span>{release.release_date}</span>
                            <span>{release.label}</span>
                            {release.genre && <span>{release.genre}</span>}
                            <span>{release.artists.map((a) => a.name).join(', ')}</span>
                        </div>
                        {release.streaming_url && (
                            <a
                                href={release.streaming_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                            >
                                <ExternalLink className="h-3.5 w-3.5" /> Écouter
                            </a>
                        )}
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={`/releases/${release.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" /> Modifier
                        </Link>
                    </Button>
                </div>

                {/* Revenue summary */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MoneyCard label="Ventes totales" value={`${release.total_sales} vente(s)`} />
                    <MoneyCard label="Revenus bruts" value={formatMoney(release.gross_revenue)} />
                    <MoneyCard label="Part totale artistes" value={formatMoney(release.total_artist_earnings)} />
                    <MoneyCard label="Part totale label" value={formatMoney(release.total_label_earnings)} highlight />
                </div>

                {/* Contractors */}
                {release.contractors.length > 0 && (
                    <div className="rounded-xl border p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="font-semibold">Prestataires</h2>
                            <span className="text-muted-foreground text-sm">
                                Coût total ce son : <strong className="text-foreground">{formatMoney(release.total_contractor_cost)}</strong>
                            </span>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-muted-foreground border-b text-left">
                                    <th className="pb-2 font-medium">Prestataire</th>
                                    <th className="pb-2 font-medium">Rôle</th>
                                    <th className="pb-2 text-right font-medium">Tarif ce son</th>
                                    <th className="pb-2 text-right font-medium">Total semaine</th>
                                    <th className="pb-2 font-medium">Plafond</th>
                                </tr>
                            </thead>
                            <tbody>
                                {release.contractors.map((c) => (
                                    <tr key={c.id} className="border-b last:border-0">
                                        <td className="py-2 font-medium">{c.name}</td>
                                        <td className="py-2">{c.role}</td>
                                        <td className="py-2 text-right">{formatMoney(c.fee_per_release)}</td>
                                        <td className="py-2 text-right">{formatMoney(c.weekly_total)}</td>
                                        <td className="py-2">
                                            {c.is_capped ? (
                                                <span className="text-xs font-medium text-amber-600">$45,000 atteint</span>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Accounting per artist */}
                {release.accounting.length > 0 && (
                    <div className="rounded-xl border p-5">
                        <h2 className="mb-4 font-semibold">Répartition comptable</h2>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-muted-foreground border-b text-left">
                                    <th className="pb-2 font-medium">Artiste</th>
                                    <th className="pb-2 text-right font-medium">Part artiste</th>
                                    <th className="pb-2 text-right font-medium">Part label</th>
                                    <th className="pb-2 text-right font-medium">Surplus (→ label)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {release.accounting.map((row, i) => (
                                    <tr key={i} className="border-b last:border-0">
                                        <td className="py-2 font-medium">{row.artist_name}</td>
                                        <td className="py-2 text-right">{formatMoney(row.artist_earnings)}</td>
                                        <td className="py-2 text-right">{formatMoney(row.label_earnings)}</td>
                                        <td className="py-2 text-right">
                                            {row.surplus > 0 ? (
                                                <span className="text-amber-600">{formatMoney(row.surplus)}</span>
                                            ) : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Add sales */}
                <div className="rounded-xl border p-5">
                    <h2 className="mb-4 font-semibold">Enregistrer des ventes</h2>
                    <form onSubmit={submitSale} className="flex flex-wrap items-end gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="quantity">Nombre de ventes *</Label>
                            <Input
                                id="quantity"
                                type="number"
                                min={1}
                                value={data.quantity}
                                onChange={(e) => setData('quantity', e.target.value)}
                                placeholder="ex: 150"
                                className="w-40"
                            />
                            <InputError message={errors.quantity} />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="sale_date">Date *</Label>
                            <Input
                                id="sale_date"
                                type="date"
                                value={data.sale_date}
                                onChange={(e) => setData('sale_date', e.target.value)}
                                className="w-40"
                            />
                            <InputError message={errors.sale_date} />
                        </div>
                        <div className="grid gap-1.5 flex-1">
                            <Label htmlFor="notes">Notes</Label>
                            <Input
                                id="notes"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="Optionnel..."
                            />
                        </div>
                        <Button type="submit" disabled={processing}>
                            {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            Enregistrer
                        </Button>
                    </form>

                    {data.quantity && Number(data.quantity) > 0 && (
                        <p className="text-muted-foreground mt-2 text-sm">
                            Aperçu : {data.quantity} ventes × $700 = <strong>{formatMoney(Number(data.quantity) * 700)}</strong>
                        </p>
                    )}
                </div>

                {/* Sales history */}
                <div className="rounded-xl border p-5">
                    <h2 className="mb-4 font-semibold">Historique des ventes</h2>
                    {release.sales.length === 0 ? (
                        <p className="text-muted-foreground text-sm">Aucune vente enregistrée.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-muted-foreground border-b text-left">
                                    <th className="pb-2 font-medium">Date</th>
                                    <th className="pb-2 text-right font-medium">Ventes</th>
                                    <th className="pb-2 text-right font-medium">Revenus</th>
                                    <th className="pb-2 font-medium">Notes</th>
                                    <th className="pb-2 font-medium">Enregistré par</th>
                                    <th className="pb-2 font-medium"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {release.sales.map((s) => (
                                    <tr key={s.id} className="border-b last:border-0">
                                        <td className="py-2">{s.sale_date}</td>
                                        <td className="py-2 text-right">{s.quantity}</td>
                                        <td className="py-2 text-right font-medium">{formatMoney(s.revenue)}</td>
                                        <td className="text-muted-foreground py-2">{s.notes ?? '—'}</td>
                                        <td className="text-muted-foreground py-2">{s.recorded_by}</td>
                                        <td className="py-2">
                                            <Button variant="ghost" size="icon" onClick={() => deleteSale(s.id)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </td>
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
