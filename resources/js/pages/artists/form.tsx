import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';
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
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(`/artists/${artist!.id}`);
        } else {
            post('/artists');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEditing ? 'Modifier l\'artiste' : 'Ajouter un artiste'} />
            <div className="flex flex-1 flex-col gap-6 p-6">
                <h1 className="text-2xl font-bold">{isEditing ? 'Modifier l\'artiste' : 'Ajouter un artiste'}</h1>

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
