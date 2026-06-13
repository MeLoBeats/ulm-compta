import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Disc3, ExternalLink, Music, Users } from 'lucide-react';

interface ReleaseCard {
    id: number;
    title: string;
    type: string;
    release_date: string;
    label: string;
    genre: string | null;
    streaming_url: string | null;
    cover_path: string | null;
    artists: string[];
}

interface ArtistCard {
    id: number;
    name: string;
    label: string;
    bio: string | null;
    image_path: string | null;
}

interface Stats {
    artists: number;
    releases: number;
    labels: number;
}

interface Props {
    releases: ReleaseCard[];
    artists: ArtistCard[];
    stats: Stats;
}

const typeStyles: Record<string, string> = {
    Single: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    EP: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    Album: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

export default function Welcome({ releases, artists, stats }: Props) {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="ULM Records — San Andreas">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700,800,900" rel="stylesheet" />
            </Head>

            <div className="min-h-screen bg-zinc-950 text-white" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>

                {/* ── Navbar ── */}
                <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="ULM Records" className="h-8 w-8 object-contain" />
                            <span className="text-sm font-bold tracking-[0.2em] text-white/90 uppercase">ULM Records</span>
                        </div>
                        {auth.user ? (
                            <Link
                                href={route('dashboard')}
                                className="rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-black transition hover:bg-amber-400"
                            >
                                Dashboard →
                            </Link>
                        ) : (
                            <Link
                                href={route('login')}
                                className="rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                            >
                                Connexion
                            </Link>
                        )}
                    </div>
                </header>

                {/* ── Hero ── */}
                <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20 text-center">
                    {/* Glow blobs */}
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/8 blur-[120px]" />
                        <div className="absolute left-1/4 top-2/3 h-[300px] w-[300px] rounded-full bg-purple-500/6 blur-[80px]" />
                        <div className="absolute right-1/4 top-1/4 h-[250px] w-[250px] rounded-full bg-sky-500/6 blur-[80px]" />
                    </div>

                    {/* Grid overlay */}
                    <div
                        className="pointer-events-none absolute inset-0 opacity-[0.025]"
                        style={{
                            backgroundImage:
                                'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
                            backgroundSize: '60px 60px',
                        }}
                    />

                    <div className="relative z-10 max-w-4xl">
                        {/* Logo */}
                        <div className="mb-8 flex justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 scale-150 rounded-full bg-amber-500/20 blur-2xl" />
                                <img src="/logo.png" alt="ULM Records" className="relative h-28 w-28 object-contain drop-shadow-2xl" />
                            </div>
                        </div>

                        <div className="mb-4 flex items-center justify-center gap-3">
                            <div className="h-px w-12 bg-amber-500/50" />
                            <span className="text-xs font-semibold tracking-[0.3em] text-amber-500 uppercase">San Andreas · GTA RP</span>
                            <div className="h-px w-12 bg-amber-500/50" />
                        </div>

                        <h1 className="mb-5 bg-gradient-to-b from-white via-white to-zinc-400 bg-clip-text text-7xl font-black uppercase tracking-tighter text-transparent md:text-9xl">
                            ULM<br />Records
                        </h1>

                        <p className="mx-auto mb-12 max-w-md text-base leading-relaxed text-zinc-400">
                            La maison de disque de référence de San Andreas. Artistes signés, productions exclusives, labels indépendants.
                        </p>

                        {/* Stats */}
                        <div className="mb-12 flex items-center justify-center gap-10">
                            <StatItem value={stats.artists} label="Artistes" />
                            <div className="h-10 w-px bg-white/10" />
                            <StatItem value={stats.releases} label="Sorties" />
                            <div className="h-10 w-px bg-white/10" />
                            <StatItem value={stats.labels} label="Labels" />
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-4">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="rounded-full bg-amber-500 px-8 py-3.5 text-sm font-bold text-black transition duration-200 hover:scale-105 hover:bg-amber-400"
                                >
                                    Accéder au CRM →
                                </Link>
                            ) : (
                                <Link
                                    href={route('login')}
                                    className="rounded-full bg-amber-500 px-8 py-3.5 text-sm font-bold text-black transition duration-200 hover:scale-105 hover:bg-amber-400"
                                >
                                    Connexion →
                                </Link>
                            )}
                            {releases.length > 0 && (
                                <a
                                    href="#releases"
                                    className="rounded-full border border-white/15 px-8 py-3.5 text-sm font-semibold text-white/70 transition hover:border-white/30 hover:text-white"
                                >
                                    Découvrir ↓
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
                        <div className="h-12 w-px animate-pulse bg-gradient-to-b from-transparent to-white/20" />
                    </div>
                </section>

                {/* ── Latest Releases ── */}
                {releases.length > 0 && (
                    <section id="releases" className="px-6 py-28">
                        <div className="mx-auto max-w-7xl">
                            <SectionTitle icon={<Disc3 className="h-5 w-5" />} label="Dernières sorties" />
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                                {releases.map((release) => (
                                    <ReleaseItem key={release.id} release={release} />
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ── Artists ── */}
                {artists.length > 0 && (
                    <section id="artists" className="relative px-6 py-28">
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-zinc-900/0 via-zinc-900/60 to-zinc-900/0" />
                        <div className="relative mx-auto max-w-7xl">
                            <SectionTitle icon={<Music className="h-5 w-5" />} label="Nos artistes" />
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                                {artists.map((artist) => (
                                    <ArtistItem key={artist.id} artist={artist} />
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ── Footer ── */}
                <footer className="border-t border-white/5 px-6 py-10">
                    <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 text-center">
                        <div className="flex items-center gap-2">
                            <img src="/logo.png" alt="" className="h-5 w-5 object-contain opacity-40" />
                            <span className="text-sm font-bold tracking-widest text-zinc-600 uppercase">ULM Records</span>
                        </div>
                        <p className="text-xs text-zinc-700">© {new Date().getFullYear()} ULM Records · San Andreas · GTA RP</p>
                        {!auth.user && (
                            <Link
                                href={route('login')}
                                className="text-xs text-zinc-600 underline underline-offset-4 transition hover:text-zinc-400"
                            >
                                Accès staff
                            </Link>
                        )}
                    </div>
                </footer>
            </div>
        </>
    );
}

function StatItem({ value, label }: { value: number; label: string }) {
    return (
        <div className="text-center">
            <div className="text-3xl font-black text-white">{value}</div>
            <div className="text-xs tracking-widest text-zinc-500 uppercase">{label}</div>
        </div>
    );
}

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="mb-10 flex items-center gap-4">
            <div className="flex items-center gap-2 text-amber-500">
                {icon}
                <span className="text-xs font-semibold tracking-[0.25em] uppercase">{label}</span>
            </div>
            <div className="h-px flex-1 bg-white/5" />
        </div>
    );
}

function ReleaseItem({ release }: { release: ReleaseCard }) {
    const typeStyle = typeStyles[release.type] ?? 'bg-zinc-700/30 text-zinc-400 border-zinc-700/50';

    return (
        <div className="group relative overflow-hidden rounded-xl border border-white/5 bg-zinc-900 transition duration-300 hover:-translate-y-1 hover:border-white/15">
            <div className="relative aspect-square overflow-hidden bg-zinc-800">
                {release.cover_path ? (
                    <img
                        src={`/storage/${release.cover_path}`}
                        alt={release.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <Disc3 className="h-12 w-12 text-zinc-700" />
                    </div>
                )}
                {release.streaming_url && (
                    <a
                        href={release.streaming_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition group-hover:opacity-100"
                    >
                        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-black">
                            <ExternalLink className="h-3.5 w-3.5" /> Écouter
                        </div>
                    </a>
                )}
                <span className={`absolute right-2 top-2 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${typeStyle}`}>
                    {release.type}
                </span>
            </div>

            <div className="p-3">
                <p className="truncate text-sm font-bold text-white">{release.title}</p>
                <p className="truncate text-xs text-zinc-400">{release.artists.join(', ')}</p>
                <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-600">{release.label}</span>
                    <span className="text-[10px] text-zinc-600">{release.release_date}</span>
                </div>
                {release.genre && <span className="mt-1 inline-block text-[10px] text-zinc-600">{release.genre}</span>}
            </div>
        </div>
    );
}

function ArtistItem({ artist }: { artist: ArtistCard }) {
    return (
        <div className="group relative overflow-hidden rounded-xl border border-white/5 bg-zinc-900 transition duration-300 hover:-translate-y-1 hover:border-white/15">
            <div className="relative aspect-square overflow-hidden bg-zinc-800">
                {artist.image_path ? (
                    <img
                        src={`/storage/${artist.image_path}`}
                        alt={artist.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <Users className="h-10 w-10 text-zinc-700" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-80" />
            </div>

            <div className="p-3">
                <p className="truncate text-sm font-bold text-white">{artist.name}</p>
                <p className="truncate text-xs text-zinc-500">{artist.label}</p>
                {artist.bio && <p className="mt-1.5 line-clamp-2 text-[10px] leading-relaxed text-zinc-600">{artist.bio}</p>}
            </div>
        </div>
    );
}
