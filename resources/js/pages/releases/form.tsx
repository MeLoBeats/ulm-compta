import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Release {
    id?: number;
    title: string;
    type: string;
    release_date: string;
    label_id: number | null;
    streaming_url: string | null;
    genre: string | null;
    artists: Array<{ id: number }>;
    contractors: Array<{ id: number }>;
}

interface Artist {
    id: number;
    name: string;
    label_id: number | null;
    contract_type: string;
}

interface Contractor {
    id: number;
    name: string;
    role: string;
    fee_per_release: number | null;
}

interface LabelOption {
    id: number;
    name: string;
}

interface Props {
    release?: Release;
    labels: LabelOption[];
    artists: Artist[];
    contractors: Contractor[];
    releaseTypes: string[];
}

function formatMoney(amount: number | null) {
    if (!amount) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

export default function ReleaseForm({ release, labels, artists, contractors, releaseTypes }: Props) {
    const isEditing = !!release?.id;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Sorties', href: '/releases' },
        { title: isEditing ? 'Modifier' : 'Nouvelle sortie', href: '#' },
    ];

    const existingArtistIds = release?.artists?.map((a) => a.id.toString()) ?? [];
    const existingContractorIds = release?.contractors?.map((c) => c.id.toString()) ?? [];

    const { data, setData, post, put, processing, errors } = useForm({
        title: release?.title ?? '',
        type: release?.type ?? 'Single',
        release_date: release?.release_date ?? new Date().toISOString().split('T')[0],
        label_id: release?.label_id?.toString() ?? '',
        streaming_url: release?.streaming_url ?? '',
        genre: release?.genre ?? '',
        artist_ids: existingArtistIds,
        contractor_ids: existingContractorIds,
    });

    const toggleArtist = (id: string) => {
        const current = data.artist_ids as string[];
        setData('artist_ids', current.includes(id) ? current.filter((a) => a !== id) : [...current, id]);
    };

    const toggleContractor = (id: string) => {
        const current = data.contractor_ids as string[];
        setData('contractor_ids', current.includes(id) ? current.filter((c) => c !== id) : [...current, id]);
    };

    const selectedContractors = contractors.filter((c) => (data.contractor_ids as string[]).includes(c.id.toString()));
    const totalContractorCost = selectedContractors.reduce((sum, c) => sum + (c.fee_per_release ?? 0), 0);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(`/releases/${release!.id}`);
        } else {
            post('/releases');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEditing ? 'Modifier la sortie' : 'Nouvelle sortie'} />
            <div className="flex flex-1 flex-col gap-6 p-6">
                <h1 className="text-2xl font-bold">{isEditing ? 'Modifier la sortie' : 'Nouvelle sortie musicale'}</h1>

                <form onSubmit={submit} className="max-w-2xl space-y-5">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Titre *</Label>
                        <Input id="title" value={data.title} onChange={(e) => setData('title', e.target.value)} placeholder="ex: Trap Season Vol. 1" />
                        <InputError message={errors.title} />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label>Type *</Label>
                            <Select value={data.type} onValueChange={(v) => setData('type', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {releaseTypes.map((t) => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.type} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="release_date">Date de sortie *</Label>
                            <Input id="release_date" type="date" value={data.release_date} onChange={(e) => setData('release_date', e.target.value)} />
                            <InputError message={errors.release_date} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="genre">Genre</Label>
                            <Input id="genre" value={data.genre} onChange={(e) => setData('genre', e.target.value)} placeholder="ex: Trap, RnB..." />
                            <InputError message={errors.genre} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Label (vide = ULM Records)</Label>
                            <Select value={data.label_id} onValueChange={(v) => setData('label_id', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="ULM Records (direct)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">ULM Records (direct)</SelectItem>
                                    {labels.map((l) => (
                                        <SelectItem key={l.id} value={l.id.toString()}>
                                            {l.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.label_id} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="streaming_url">Lien streaming</Label>
                            <Input
                                id="streaming_url"
                                type="url"
                                value={data.streaming_url}
                                onChange={(e) => setData('streaming_url', e.target.value)}
                                placeholder="https://..."
                            />
                            <InputError message={errors.streaming_url} />
                        </div>
                    </div>

                    {/* Artists */}
                    <div className="grid gap-2">
                        <Label>Artiste(s) *</Label>
                        <p className="text-muted-foreground text-xs">Sélectionnez un ou plusieurs artistes</p>
                        {errors.artist_ids && <p className="text-destructive text-sm">{errors.artist_ids}</p>}
                        <div className="rounded-lg border p-3 space-y-2 max-h-48 overflow-y-auto">
                            {artists.length === 0 ? (
                                <p className="text-muted-foreground text-sm">Aucun artiste disponible. Créez-en un d'abord.</p>
                            ) : (
                                artists.map((a) => (
                                    <div key={a.id} className="flex items-center gap-3">
                                        <Checkbox
                                            id={`artist-${a.id}`}
                                            checked={(data.artist_ids as string[]).includes(a.id.toString())}
                                            onCheckedChange={() => toggleArtist(a.id.toString())}
                                        />
                                        <label htmlFor={`artist-${a.id}`} className="cursor-pointer text-sm">
                                            {a.name}
                                            <span className="text-muted-foreground ml-2 text-xs">({a.contract_type})</span>
                                        </label>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Contractors */}
                    <div className="grid gap-2">
                        <Label>Prestataires</Label>
                        <p className="text-muted-foreground text-xs">Ingé son, graphiste, beatmaker, clippeur — tarif fixe par son</p>
                        <div className="rounded-lg border p-3 space-y-2 max-h-48 overflow-y-auto">
                            {contractors.length === 0 ? (
                                <p className="text-muted-foreground text-sm">Aucun prestataire actif. Créez un salarié avec un poste prestataire.</p>
                            ) : (
                                contractors.map((c) => (
                                    <div key={c.id} className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                id={`contractor-${c.id}`}
                                                checked={(data.contractor_ids as string[]).includes(c.id.toString())}
                                                onCheckedChange={() => toggleContractor(c.id.toString())}
                                            />
                                            <label htmlFor={`contractor-${c.id}`} className="cursor-pointer text-sm">
                                                {c.name}
                                                <span className="text-muted-foreground ml-2 text-xs">{c.role}</span>
                                            </label>
                                        </div>
                                        <span className="text-sm font-medium">{formatMoney(c.fee_per_release)}</span>
                                    </div>
                                ))
                            )}
                        </div>
                        {selectedContractors.length > 0 && (
                            <p className="text-muted-foreground text-xs">
                                Coût prestataires pour ce son : <strong className="text-foreground">{formatMoney(totalContractorCost)}</strong>
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={processing}>
                            {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? 'Mettre à jour' : 'Créer la sortie'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => history.back()}>
                            Annuler
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
