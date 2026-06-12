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

interface LabelData {
    id?: number;
    name: string;
    description: string | null;
    director_employee_id: number | null;
    founded_at: string | null;
}

interface Employee {
    id: number;
    name: string;
}

interface Props {
    label?: LabelData;
    employees: Employee[];
}

export default function LabelForm({ label, employees }: Props) {
    const isEditing = !!label?.id;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Labels', href: '/labels' },
        { title: isEditing ? 'Modifier' : 'Nouveau', href: '#' },
    ];

    const { data, setData, post, put, processing, errors } = useForm({
        name: label?.name ?? '',
        description: label?.description ?? '',
        director_employee_id: label?.director_employee_id?.toString() ?? '',
        founded_at: label?.founded_at ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(`/labels/${label!.id}`);
        } else {
            post('/labels');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEditing ? 'Modifier le label' : 'Nouveau label'} />
            <div className="flex flex-1 flex-col gap-6 p-6">
                <h1 className="text-2xl font-bold">{isEditing ? 'Modifier le label' : 'Nouveau label'}</h1>

                <form onSubmit={submit} className="max-w-lg space-y-5">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nom du label *</Label>
                        <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="ex: Banger Records" />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <textarea
                            id="description"
                            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Description du label..."
                        />
                        <InputError message={errors.description} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Directeur</Label>
                            <Select value={data.director_employee_id} onValueChange={(v) => setData('director_employee_id', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisir un directeur" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Aucun</SelectItem>
                                    {employees.map((e) => (
                                        <SelectItem key={e.id} value={e.id.toString()}>
                                            {e.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.director_employee_id} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="founded_at">Date de création</Label>
                            <Input id="founded_at" type="date" value={data.founded_at} onChange={(e) => setData('founded_at', e.target.value)} />
                            <InputError message={errors.founded_at} />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={processing}>
                            {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? 'Mettre à jour' : 'Créer le label'}
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
