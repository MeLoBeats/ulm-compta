import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ChevronDown, ChevronLeft, ChevronRight, Image, LoaderCircle, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Comptabilité', href: '/accounting' },
];

interface Entry {
    id: number;
    type: string;
    category: string;
    category_label: string;
    amount: number;
    label: string | null;
    notes: string | null;
    recorded_by: string | null;
    created_at: string;
}

interface GraphicWork {
    id: number;
    employee_name: string;
    work_type: 'cover' | 'affiche';
    quantity: number;
    total: number;
    notes: string | null;
    recorded_by: string | null;
    created_at: string;
}

interface Graphiste {
    id: number;
    name: string;
    role: string;
}

interface PaymentDetail {
    name: string;
    amount: number;
}

interface ContractorDetail {
    name: string;
    role: string;
    releases_count: number;
    covers_count: number;
    affiches_count: number;
    amount: number;
}

interface Auto {
    sales_revenue: number;
    employee_salaries: number;
    artist_payments: number;
    artist_payment_details: PaymentDetail[];
    contractor_costs: number;
    contractor_details: ContractorDetail[];
}

interface Totals {
    revenue: number;
    deductible: number;
    non_deductible: number;
    net_result: number;
    taxable_income: number;
}

interface Categories {
    revenue: Record<string, string>;
    deductible_expense: Record<string, string>;
    non_deductible_expense: Record<string, string>;
}

interface Props {
    weekStart: string;
    weekEnd: string;
    weekLabel: string;
    prevWeek: string;
    nextWeek: string;
    isCurrentWeek: boolean;
    auto: Auto;
    entries: Entry[];
    graphicWorks: GraphicWork[];
    graphistes: Graphiste[];
    totals: Totals;
    categories: Categories;
}

const SECTION_CONFIG = {
    revenue: {
        label: 'Revenus',
        color: 'text-emerald-400',
        border: 'border-emerald-500/20',
        bg: 'bg-emerald-500/5',
        badge: 'bg-emerald-500/15 text-emerald-400',
    },
    deductible_expense: {
        label: 'Dépenses déductibles',
        color: 'text-red-400',
        border: 'border-red-500/20',
        bg: 'bg-red-500/5',
        badge: 'bg-red-500/15 text-red-400',
    },
    non_deductible_expense: {
        label: 'Dépenses non déductibles',
        color: 'text-orange-400',
        border: 'border-orange-500/20',
        bg: 'bg-orange-500/5',
        badge: 'bg-orange-500/15 text-orange-400',
    },
} as const;

type EntryType = keyof typeof SECTION_CONFIG;

interface AutoLine {
    label: string;
    amount: number;
    details?: Array<{ name: string; amount: number }>;
}

const GRAPHIC_PRICES: Record<string, number> = { cover: 3000, affiche: 5000 };
const GRAPHIC_LABELS: Record<string, string> = { cover: 'Cover', affiche: 'Affiche' };

function formatMoney(amount: number) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function buildContractorLabel(d: ContractorDetail): string {
    const parts: string[] = [];
    if (d.releases_count > 0) parts.push(`×${d.releases_count} son${d.releases_count > 1 ? 's' : ''}`);
    if (d.covers_count > 0) parts.push(`×${d.covers_count} cover${d.covers_count > 1 ? 's' : ''}`);
    if (d.affiches_count > 0) parts.push(`×${d.affiches_count} affiche${d.affiches_count > 1 ? 's' : ''}`);
    return `${d.name} — ${d.role}${parts.length ? ` (${parts.join(' · ')})` : ''}`;
}

export default function AccountingIndex({
    weekStart, weekEnd, weekLabel, prevWeek, nextWeek, isCurrentWeek,
    auto, entries, graphicWorks, graphistes, totals, categories,
}: Props) {
    const { flash } = usePage<{ flash: { success?: string } }>().props;
    const [activeForm, setActiveForm] = useState<EntryType | null>(null);

    const revenueEntries = entries.filter((e) => e.type === 'revenue');
    const deductibleEntries = entries.filter((e) => e.type === 'deductible_expense');
    const nonDeductibleEntries = entries.filter((e) => e.type === 'non_deductible_expense');

    function deleteEntry(id: number) {
        if (confirm('Supprimer cette entrée ?')) {
            router.delete(`/accounting/${id}`);
        }
    }

    function deleteGraphicWork(id: number) {
        if (confirm('Supprimer ce travail graphique ?')) {
            router.delete(`/graphic-works/${id}`);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Comptabilité — ULM Records" />
            <div className="flex flex-1 flex-col gap-6 p-6">

                {flash?.success && (
                    <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        {flash.success}
                    </div>
                )}

                {/* Week navigation */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Comptabilité</h1>
                        <p className="text-muted-foreground text-sm">{weekLabel}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" asChild>
                            <Link href={`/accounting?week=${prevWeek}`}>
                                <ChevronLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        {!isCurrentWeek && (
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/accounting">Semaine actuelle</Link>
                            </Button>
                        )}
                        <Button variant="outline" size="icon" asChild>
                            <Link href={`/accounting?week=${nextWeek}`}>
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Summary cards */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard
                        label="Total revenus"
                        value={formatMoney(totals.revenue)}
                        sub={`dont ${formatMoney(auto.sales_revenue)} de ventes`}
                        color="emerald"
                    />
                    <SummaryCard
                        label="Dépenses déductibles"
                        value={formatMoney(totals.deductible)}
                        sub={`${formatMoney(auto.employee_salaries)} salaires · ${formatMoney(auto.artist_payments)} artistes · ${formatMoney(auto.contractor_costs)} prestataires`}
                        color="red"
                    />
                    <SummaryCard
                        label="Dép. non déductibles"
                        value={formatMoney(totals.non_deductible)}
                        color="orange"
                    />
                    <SummaryCard
                        label="Résultat net"
                        value={formatMoney(totals.net_result)}
                        sub={`Revenu imposable : ${formatMoney(totals.taxable_income)}`}
                        color={totals.net_result >= 0 ? 'emerald' : 'red'}
                        highlight
                    />
                </div>

                {/* Travaux graphiques */}
                <GraphicWorksSection
                    weekStart={weekStart}
                    graphicWorks={graphicWorks}
                    graphistes={graphistes}
                    onDelete={deleteGraphicWork}
                />

                {/* Revenue section */}
                <AccountingSection
                    type="revenue"
                    entries={revenueEntries}
                    categories={categories.revenue}
                    weekStart={weekStart}
                    onDelete={deleteEntry}
                    activeForm={activeForm}
                    setActiveForm={setActiveForm}
                    autoLines={[
                        { label: 'Ventes (automatique)', amount: auto.sales_revenue },
                    ]}
                />

                {/* Deductible expenses */}
                <AccountingSection
                    type="deductible_expense"
                    entries={deductibleEntries}
                    categories={categories.deductible_expense}
                    weekStart={weekStart}
                    onDelete={deleteEntry}
                    activeForm={activeForm}
                    setActiveForm={setActiveForm}
                    autoLines={[
                        {
                            label: 'Salaires employés (automatique)',
                            amount: auto.employee_salaries,
                        },
                        {
                            label: 'Paiements artistes (automatique)',
                            amount: auto.artist_payments,
                            details: auto.artist_payment_details,
                        },
                        {
                            label: 'Prestataires (automatique)',
                            amount: auto.contractor_costs,
                            details: auto.contractor_details.map((d) => ({
                                name: buildContractorLabel(d),
                                amount: d.amount,
                            })),
                        },
                    ]}
                />

                {/* Non-deductible expenses */}
                <AccountingSection
                    type="non_deductible_expense"
                    entries={nonDeductibleEntries}
                    categories={categories.non_deductible_expense}
                    weekStart={weekStart}
                    onDelete={deleteEntry}
                    activeForm={activeForm}
                    setActiveForm={setActiveForm}
                />
            </div>
        </AppLayout>
    );
}

/* ─── Travaux graphiques ─── */
function GraphicWorksSection({ weekStart, graphicWorks, graphistes, onDelete }: {
    weekStart: string;
    graphicWorks: GraphicWork[];
    graphistes: Graphiste[];
    onDelete: (id: number) => void;
}) {
    const [isAdding, setIsAdding] = useState(false);
    const weeklyTotal = graphicWorks.reduce((s, gw) => s + gw.total, 0);

    const { data, setData, post, processing, errors, reset } = useForm({
        week_start: weekStart,
        employee_id: '',
        work_type: 'cover' as 'cover' | 'affiche',
        quantity: '1',
        notes: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/graphic-works', {
            onSuccess: () => {
                reset('employee_id', 'quantity', 'notes');
                setIsAdding(false);
            },
        });
    };

    const costPreview = data.quantity ? Number(data.quantity) * (GRAPHIC_PRICES[data.work_type] ?? 0) : 0;

    return (
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5">
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
                <div className="flex items-center gap-3">
                    <Image className="h-4 w-4 text-purple-400" />
                    <h2 className="font-semibold text-purple-400">Travaux graphiques</h2>
                    <span className="text-muted-foreground text-xs">covers $3 000 · affiches $5 000</span>
                </div>
                <div className="flex items-center gap-3">
                    {weeklyTotal > 0 && (
                        <span className="text-sm font-bold">{formatMoney(weeklyTotal)}</span>
                    )}
                    <Button
                        size="sm"
                        variant={isAdding ? 'secondary' : 'outline'}
                        onClick={() => setIsAdding((v) => !v)}
                    >
                        {isAdding ? 'Fermer' : '+ Ajouter'}
                    </Button>
                </div>
            </div>

            {/* Liste */}
            {graphicWorks.length > 0 && (
                <div className="px-5 py-2">
                    {graphicWorks.map((gw) => (
                        <div key={gw.id} className="flex items-center justify-between border-b border-white/5 py-2.5 last:border-0">
                            <div className="flex min-w-0 items-center gap-3">
                                <Badge variant="outline" className={gw.work_type === 'cover' ? 'text-purple-400 border-purple-400/40' : 'text-pink-400 border-pink-400/40'}>
                                    {GRAPHIC_LABELS[gw.work_type]}
                                </Badge>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">
                                        {gw.employee_name} — ×{gw.quantity}
                                    </p>
                                    {gw.notes && <p className="text-muted-foreground truncate text-xs">{gw.notes}</p>}
                                    <p className="text-muted-foreground text-[10px]">{gw.recorded_by} · {gw.created_at}</p>
                                </div>
                            </div>
                            <div className="ml-3 flex shrink-0 items-center gap-3">
                                <span className="font-semibold">{formatMoney(gw.total)}</span>
                                <Button variant="ghost" size="icon" onClick={() => onDelete(gw.id)}>
                                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {graphicWorks.length === 0 && !isAdding && (
                <p className="text-muted-foreground px-5 py-4 text-sm">Aucun travail graphique cette semaine.</p>
            )}

            {/* Formulaire d'ajout */}
            {isAdding && (
                <div className="border-t border-white/5 px-5 py-4">
                    <form onSubmit={submit} className="grid gap-3">
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="grid gap-1.5">
                                <Label className="text-xs">Graphiste *</Label>
                                <Select value={data.employee_id} onValueChange={(v) => setData('employee_id', v)}>
                                    <SelectTrigger className="h-8 w-48 text-xs">
                                        <SelectValue placeholder="Choisir..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {graphistes.map((g) => (
                                            <SelectItem key={g.id} value={g.id.toString()} className="text-xs">
                                                {g.name} <span className="text-muted-foreground">({g.role})</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.employee_id} />
                            </div>

                            <div className="grid gap-1.5">
                                <Label className="text-xs">Type *</Label>
                                <Select value={data.work_type} onValueChange={(v) => setData('work_type', v as 'cover' | 'affiche')}>
                                    <SelectTrigger className="h-8 w-44 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cover" className="text-xs">Cover — $3 000 / pièce</SelectItem>
                                        <SelectItem value="affiche" className="text-xs">Affiche — $5 000 / pièce</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.work_type} />
                            </div>

                            <div className="grid gap-1.5">
                                <Label className="text-xs">Quantité *</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    className="h-8 w-24 text-xs"
                                    value={data.quantity}
                                    onChange={(e) => setData('quantity', e.target.value)}
                                />
                                <InputError message={errors.quantity} />
                            </div>

                            <div className="grid flex-1 gap-1.5">
                                <Label className="text-xs">Notes</Label>
                                <Input
                                    className="h-8 text-xs"
                                    placeholder="Optionnel..."
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                />
                            </div>
                        </div>

                        {costPreview > 0 && (
                            <p className="text-muted-foreground text-xs">
                                Coût : ×{data.quantity} × {formatMoney(GRAPHIC_PRICES[data.work_type])} = <strong className="text-foreground">{formatMoney(costPreview)}</strong>
                            </p>
                        )}

                        <div>
                            <Button type="submit" size="sm" disabled={processing}>
                                {processing && <LoaderCircle className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                                Enregistrer
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

/* ─── Summary card ─── */
function SummaryCard({ label, value, sub, color, highlight }: {
    label: string; value: string; sub?: string; color: 'emerald' | 'red' | 'orange'; highlight?: boolean;
}) {
    const colors = {
        emerald: 'text-emerald-400',
        red: 'text-red-400',
        orange: 'text-orange-400',
    };
    return (
        <div className={`rounded-xl border p-4 ${highlight ? 'border-primary/30 bg-primary/5' : ''}`}>
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${colors[color]}`}>{value}</p>
            {sub && <p className="text-muted-foreground mt-1 text-xs">{sub}</p>}
        </div>
    );
}

/* ─── Section comptable (revenus / dépenses) ─── */
function AccountingSection({ type, entries, categories, weekStart, onDelete, activeForm, setActiveForm, autoLines }: {
    type: EntryType;
    entries: Entry[];
    categories: Record<string, string>;
    weekStart: string;
    onDelete: (id: number) => void;
    activeForm: EntryType | null;
    setActiveForm: (t: EntryType | null) => void;
    autoLines?: AutoLine[];
}) {
    const config = SECTION_CONFIG[type];
    const isOpen = activeForm === type;
    const autoTotal = autoLines?.reduce((s, l) => s + l.amount, 0) ?? 0;
    const total = autoTotal + entries.reduce((s, e) => s + e.amount, 0);
    const isExpense = type !== 'revenue';

    return (
        <div className={`rounded-xl border ${config.border} ${config.bg}`}>
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
                <div className="flex items-center gap-3">
                    {isExpense ? (
                        <TrendingDown className={`h-4 w-4 ${config.color}`} />
                    ) : (
                        <TrendingUp className={`h-4 w-4 ${config.color}`} />
                    )}
                    <h2 className={`font-semibold ${config.color}`}>{config.label}</h2>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold">{formatMoney(total)}</span>
                    <Button
                        size="sm"
                        variant={isOpen ? 'secondary' : 'outline'}
                        onClick={() => setActiveForm(isOpen ? null : type)}
                    >
                        {isOpen ? 'Fermer' : '+ Ajouter'}
                    </Button>
                </div>
            </div>

            {/* Lignes automatiques avec détail dépliable */}
            {autoLines && autoLines.some((l) => l.amount > 0) && (
                <div className="px-5 pt-3">
                    {autoLines.filter((l) => l.amount > 0).map((line) => (
                        <AutoLineRow key={line.label} line={line} />
                    ))}
                </div>
            )}

            {/* Entrées manuelles */}
            {entries.length > 0 && (
                <div className="px-5 pb-2 pt-1">
                    {entries.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between border-b border-white/5 py-2.5 last:border-0">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${config.badge}`}>
                                    {entry.category_label}
                                </span>
                                <div className="min-w-0">
                                    {entry.label && <p className="truncate text-sm font-medium">{entry.label}</p>}
                                    {entry.notes && <p className="text-muted-foreground truncate text-xs">{entry.notes}</p>}
                                    <p className="text-muted-foreground text-[10px]">{entry.recorded_by} · {entry.created_at}</p>
                                </div>
                            </div>
                            <div className="ml-3 flex shrink-0 items-center gap-3">
                                <span className="font-semibold">{formatMoney(entry.amount)}</span>
                                <Button variant="ghost" size="icon" onClick={() => onDelete(entry.id)}>
                                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {entries.length === 0 && !autoLines?.some((l) => l.amount > 0) && !isOpen && (
                <p className="text-muted-foreground px-5 py-4 text-sm">Aucune entrée cette semaine.</p>
            )}

            {/* Formulaire d'ajout */}
            {isOpen && (
                <div className="border-t border-white/5 px-5 py-4">
                    <AddEntryForm type={type} categories={categories} weekStart={weekStart} onSuccess={() => setActiveForm(null)} />
                </div>
            )}
        </div>
    );
}

/* ─── Ligne auto dépliable ─── */
function AutoLineRow({ line }: { line: AutoLine }) {
    const [expanded, setExpanded] = useState(false);
    const hasDetails = line.details && line.details.length > 0;

    return (
        <div className="mb-1">
            <div className="flex items-center justify-between py-2 text-sm">
                <button
                    type="button"
                    className={`flex items-center gap-1 text-left italic ${hasDetails ? 'cursor-pointer hover:text-foreground' : 'cursor-default'} text-muted-foreground`}
                    onClick={() => hasDetails && setExpanded((v) => !v)}
                >
                    {hasDetails && (
                        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    )}
                    {line.label}
                </button>
                <span className="font-medium">{formatMoney(line.amount)}</span>
            </div>

            {hasDetails && expanded && (
                <div className="mb-1 ml-4 border-l border-white/10 pl-3">
                    {line.details!.map((detail) => (
                        <div key={detail.name} className="flex items-center justify-between py-1 text-xs">
                            <span className="text-muted-foreground">{detail.name}</span>
                            <span className="font-medium">{formatMoney(detail.amount)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─── Formulaire ajout entrée manuelle ─── */
function AddEntryForm({ type, categories, weekStart, onSuccess }: {
    type: EntryType;
    categories: Record<string, string>;
    weekStart: string;
    onSuccess: () => void;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        week_start: weekStart,
        type,
        category: '',
        amount: '',
        label: '',
        notes: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/accounting', {
            onSuccess: () => {
                reset('category', 'amount', 'label', 'notes');
                onSuccess();
            },
        });
    };

    return (
        <form onSubmit={submit} className="grid gap-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="grid gap-1.5">
                    <Label className="text-xs">Catégorie *</Label>
                    <Select value={data.category} onValueChange={(v) => setData('category', v)}>
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Choisir..." />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(categories).map(([key, label]) => (
                                <SelectItem key={key} value={key} className="text-xs">{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={errors.category} />
                </div>

                <div className="grid gap-1.5">
                    <Label className="text-xs">Montant * ($)</Label>
                    <Input
                        type="number"
                        min={0}
                        step={0.01}
                        className="h-8 text-xs"
                        placeholder="0"
                        value={data.amount}
                        onChange={(e) => setData('amount', e.target.value)}
                    />
                    <InputError message={errors.amount} />
                </div>

                <div className="grid gap-1.5">
                    <Label className="text-xs">Libellé</Label>
                    <Input
                        className="h-8 text-xs"
                        placeholder="Ex: Paiement ingé son"
                        value={data.label}
                        onChange={(e) => setData('label', e.target.value)}
                    />
                </div>

                <div className="grid gap-1.5">
                    <Label className="text-xs">Notes</Label>
                    <Input
                        className="h-8 text-xs"
                        placeholder="Optionnel..."
                        value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)}
                    />
                </div>
            </div>

            <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={processing}>
                    {processing && <LoaderCircle className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                    Enregistrer
                </Button>
            </div>
        </form>
    );
}
