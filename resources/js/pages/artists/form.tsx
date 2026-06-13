import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, Upload, X } from 'lucide-react';
import { FormEventHandler, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Artist {
    id?: number;
    name: string;
    label_id: number | null;
    contract_type: string;
    bio: string | null;
    image_path: string | null;
}

interface LabelOption {
    id: number;
    name: string;
}

interface ContractOption {
    value: string;
    label: string;
}

interface Props {
    artist?: Artist;
    labels: LabelOption[];
    contractTypes: ContractOption[];
}

export default function ArtistForm({ artist, labels, contractTypes }: Props) {
    const isEditing = !!artist?.id;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(
        artist?.image_path ? `/storage/${artist.image_path}` : null,
    );

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Artistes', href: '/artists' },
        { title: isEditing ? 'Modifier' : 'Ajouter', href: '#' },
    ];

    const { data, setData, post, put, processing, errors } = useForm({
        name: artist?.name ?? '',
        label_id: artist?.label_id?.toString() ?? '',
        contract_type: artist?.contract_type ?? '60_40',
        bio: artist?.bio ?? '',
        image: null as File | null,
    });

    const handleFile = (file: File | null) => {
        setData('image', file);
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setPreview(artist?.image_path ? `/storage/${artist.image_path}` : null);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(`/artists/${artist!.id}`, { forceFormData: true });
        } else {
            post('/artists', { forceFormData: true });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEditing ? "Modifier l'artiste" : 'Ajouter un artiste'} />
            <div className="flex flex-1 flex-col gap-6 p-6">
                <h1 className="text-2xl font-bold">{isEditing ? "Modifier l'artiste" : 'Ajouter un artiste'}</h1>

                <form onSubmit={submit} className="max-w-lg space-y-5">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nom de l'artiste *</Label>
                        <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="ex: Lil Money" />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Label</Label>
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
                            <Label>Type de contrat *</Label>
                            <Select value={data.contract_type} onValueChange={(v) => setData('contract_type', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {contractTypes.map((c) => (
                                        <SelectItem key={c.value} value={c.value}>
                                            {c.label} (artiste/label)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.contract_type} />
                            <p className="text-muted-foreground text-xs">
                                {data.contract_type === '60_40' && 'Artiste 60% · Label 40%'}
                                {data.contract_type === '70_30' && 'Artiste 70% · Label 30%'}
                                {data.contract_type === '80_20' && 'Artiste 80% · Label 20%'}
                                {' — Plafond artiste : $45,000'}
                            </p>
                        </div>
                    </div>

                    {/* Photo */}
                    <div className="grid gap-2">
                        <Label>Photo de l'artiste</Label>
                        <div className="flex items-start gap-4">
                            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border bg-muted">
                                {preview ? (
                                    <>
                                        <img src={preview} alt="Aperçu" className="h-full w-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleFile(null);
                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                            }}
                                            className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                        <Upload className="h-6 w-6" />
                                    </div>
                                )}
                            </div>

                            <div
                                className="flex flex-1 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-6 text-center transition hover:bg-muted/40"
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const file = e.dataTransfer.files[0];
                                    if (file) handleFile(file);
                                }}
                            >
                                <Upload className="mb-2 h-5 w-5 text-muted-foreground" />
                                <p className="text-sm font-medium">Glisser ou cliquer pour uploader</p>
                                <p className="text-muted-foreground text-xs">PNG, JPG, WEBP — max 2 Mo</p>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                            />
                        </div>
                        <InputError message={errors.image} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="bio">Bio</Label>
                        <textarea
                            id="bio"
                            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                            value={data.bio}
                            onChange={(e) => setData('bio', e.target.value)}
                            placeholder="Description de l'artiste..."
                        />
                        <InputError message={errors.bio} />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={processing}>
                            {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? 'Mettre à jour' : 'Ajouter'}
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
