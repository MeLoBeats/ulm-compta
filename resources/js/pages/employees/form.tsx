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

interface Employee {
    id?: number;
    name: string;
    position_id: number | null;
    label_id: number | null;
    hired_at: string;
    fired_at: string | null;
    weekly_salary: string | null;
    fee_per_release: string | null;
    rib: string | null;
    phone: string | null;
    status: string;
}

interface PositionOption {
    id: number;
    title: string;
    is_contractor: boolean;
}

interface LabelOption {
    id: number;
    name: string;
}

interface Props {
    employee?: Employee;
    positions: PositionOption[];
    labels: LabelOption[];
}

export default function EmployeeForm({ employee, positions, labels }: Props) {
    const isEditing = !!employee?.id;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Salariés', href: '/employees' },
        { title: isEditing ? 'Modifier' : 'Ajouter', href: '#' },
    ];

    const { data, setData, post, put, processing, errors } = useForm({
        name: employee?.name ?? '',
        position_id: employee?.position_id?.toString() ?? '',
        label_id: employee?.label_id?.toString() ?? '',
        hired_at: employee?.hired_at ?? new Date().toISOString().split('T')[0],
        fired_at: employee?.fired_at ?? '',
        weekly_salary: employee?.weekly_salary ?? '',
        fee_per_release: employee?.fee_per_release ?? '',
        rib: employee?.rib ?? '',
        phone: employee?.phone ?? '',
        status: employee?.status ?? 'active',
    });

    const selectedPosition = positions.find((p) => p.id.toString() === data.position_id);
    const isContractor = selectedPosition?.is_contractor === true;

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(`/employees/${employee!.id}`);
        } else {
            post('/employees');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEditing ? 'Modifier le salarié' : 'Ajouter un salarié'} />
            <div className="flex flex-1 flex-col gap-6 p-6">
                <h1 className="text-2xl font-bold">{isEditing ? 'Modifier le salarié' : 'Ajouter un salarié'}</h1>

                <form onSubmit={submit} className="max-w-lg space-y-5">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nom (personnage RP) *</Label>
                        <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="ex: Johnny Doe" />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Poste</Label>
                            <Select value={data.position_id} onValueChange={(v) => setData('position_id', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisir un poste" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Aucun</SelectItem>
                                    {positions.map((p) => (
                                        <SelectItem key={p.id} value={p.id.toString()}>
                                            {p.title}
                                            {p.is_contractor && ' (prestataire)'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.position_id} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Label</Label>
                            <Select value={data.label_id} onValueChange={(v) => setData('label_id', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="ULM Records" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">ULM Records (principal)</SelectItem>
                                    {labels.map((l) => (
                                        <SelectItem key={l.id} value={l.id.toString()}>
                                            {l.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.label_id} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="hired_at">Date d'embauche *</Label>
                            <Input id="hired_at" type="date" value={data.hired_at} onChange={(e) => setData('hired_at', e.target.value)} />
                            <InputError message={errors.hired_at} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="fired_at">Date de départ</Label>
                            <Input id="fired_at" type="date" value={data.fired_at} onChange={(e) => setData('fired_at', e.target.value)} />
                            <InputError message={errors.fired_at} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {!isContractor && (
                            <div className="grid gap-2">
                                <Label htmlFor="weekly_salary">Salaire / semaine ($)</Label>
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
                        )}

                        {isContractor && (
                            <div className="grid gap-2">
                                <Label htmlFor="fee_per_release">Tarif par son ($)</Label>
                                <Input
                                    id="fee_per_release"
                                    type="number"
                                    min={0}
                                    value={data.fee_per_release}
                                    onChange={(e) => setData('fee_per_release', e.target.value)}
                                    placeholder="ex: 5000"
                                />
                                <InputError message={errors.fee_per_release} />
                                <p className="text-muted-foreground text-xs">Plafond hebdo : $45,000</p>
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label>Statut *</Label>
                            <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Actif</SelectItem>
                                    <SelectItem value="inactive">Inactif</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.status} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Numéro de téléphone</Label>
                            <Input
                                id="phone"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                placeholder="ex: 555-0123"
                            />
                            <InputError message={errors.phone} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="rib">RIB</Label>
                            <Input
                                id="rib"
                                value={data.rib}
                                onChange={(e) => setData('rib', e.target.value)}
                                placeholder="ex: FR76 1234 5678 9012 3456 7890 123"
                            />
                            <InputError message={errors.rib} />
                        </div>
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
