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

interface Position {
    id?: number;
    title: string;
    description: string | null;
    slots: number;
    weekly_salary: string | null;
    is_open: boolean;
    is_contractor: boolean;
}

interface Props {
    position?: Position;
}

export default function PositionForm({ position }: Props) {
    const isEditing = !!position?.id;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Postes', href: '/positions' },
        { title: isEditing ? 'Modifier' : 'Nouveau', href: '#' },
    ];

    const { data, setData, post, put, processing, errors } = useForm({
        title: position?.title ?? '',
        description: position?.description ?? '',
        slots: position?.slots ?? 1,
        weekly_salary: position?.weekly_salary ?? '',
        is_open: position?.is_open ?? true,
        is_contractor: position?.is_contractor ?? false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(`/positions/${position!.id}`);
        } else {
            post('/positions');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEditing ? 'Modifier le poste' : 'Nouveau poste'} />
            <div className="flex flex-1 flex-col gap-6 p-6">
                <h1 className="text-2xl font-bold">{isEditing ? 'Modifier le poste' : 'Nouveau poste'}</h1>

                <form onSubmit={submit} className="max-w-lg space-y-5">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Titre du poste *</Label>
                        <Input id="title" value={data.title} onChange={(e) => setData('title', e.target.value)} placeholder="ex: Directeur Artistique" />
                        <InputError message={errors.title} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <textarea
                            id="description"
                            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Description du rôle..."
                        />
                        <InputError message={errors.description} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="slots">Nombre de places *</Label>
                            <Input
                                id="slots"
                                type="number"
                                min={1}
                                value={data.slots}
                                onChange={(e) => setData('slots', Number(e.target.value))}
                            />
                            <InputError message={errors.slots} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="weekly_salary">Salaire hebdo ($)</Label>
                            <Input
                                id="weekly_salary"
                                type="number"
                                min={0}
                                value={data.weekly_salary}
                                onChange={(e) => setData('weekly_salary', e.target.value)}
                                placeholder="0"
                            />
                            <InputError message={errors.weekly_salary} />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="is_open"
                            checked={data.is_open}
                            onCheckedChange={(v) => setData('is_open', !!v)}
                        />
                        <Label htmlFor="is_open">Poste ouvert au recrutement</Label>
                    </div>

                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="is_contractor"
                            checked={data.is_contractor}
                            onCheckedChange={(v) => setData('is_contractor', !!v)}
                        />
                        <div>
                            <Label htmlFor="is_contractor">Poste prestataire</Label>
                            <p className="text-muted-foreground text-xs">
                                Ingé son, graphiste, beatmaker, clippeur — rémunéré par son avec plafond $45,000/semaine
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={processing}>
                            {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? 'Mettre à jour' : 'Créer le poste'}
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
