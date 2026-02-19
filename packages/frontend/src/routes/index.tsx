import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, Lock, Share2 } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';

export const Route = createFileRoute('/')({
    component: Index,
});

function Index() {
    const { user, isLoading } = useAuth();

    return (
        <div className='min-h-screen bg-background flex flex-col'>
            {/* Header */}
            <header className='border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50'>
                <div className='max-w-7xl mx-auto px-4 h-16 flex items-center justify-between'>
                    <div className='font-bold text-xl tracking-tight'>
                        NoteGAE
                    </div>
                    <nav className='flex gap-4'>
                        {isLoading ? null : user ? (
                            <Link to='/admin'>
                                <Button>Go to Dashboard</Button>
                            </Link>
                        ) : (
                            <Link to='/login'>
                                <Button>Login</Button>
                            </Link>
                        )}
                    </nav>
                </div>
            </header>

            {/* Hero */}
            <main className='flex-1'>
                <section className='py-20 md:py-32 px-4 text-center space-y-8 max-w-4xl mx-auto'>
                    <h1 className='text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/50'>
                        Minimalist Note Taking
                        <br />
                        for Developers
                    </h1>
                    <p className='text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed'>
                        Markdown-based, distraction-free, and beautiful by
                        default. Built with React 19, Hono, and SQLite.
                    </p>
                    <div className='flex items-center justify-center gap-4 pt-4'>
                        {user ? (
                            <Link to='/admin'>
                                <Button size='lg' className='gap-2 h-12 px-8'>
                                    Open Dashboard{' '}
                                    <ArrowRight className='h-4 w-4' />
                                </Button>
                            </Link>
                        ) : (
                            <Link to='/login'>
                                <Button size='lg' className='gap-2 h-12 px-8'>
                                    Get Started{' '}
                                    <ArrowRight className='h-4 w-4' />
                                </Button>
                            </Link>
                        )}
                    </div>
                </section>

                {/* Features */}
                <section className='py-20 bg-muted/30 border-y border-border/50'>
                    <div className='max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8'>
                        <FeatureCard
                            icon={<FileText className='h-6 w-6' />}
                            title='Markdown First'
                            description='Write comfortably with extended Markdown support. Code blocks, tables, and more.'
                        />
                        <FeatureCard
                            icon={<Lock className='h-6 w-6' />}
                            title='Private by Default'
                            description='Your notes are yours. Secure authentication and optional visibility settings.'
                        />
                        <FeatureCard
                            icon={<Share2 className='h-6 w-6' />}
                            title='Share Easily'
                            description='Share specific notes with a secure link. Control expiration and access.'
                        />
                    </div>
                </section>

                {/* Public Notes Showcase */}
                <section className='py-20 px-4'>
                    <div className='max-w-7xl mx-auto space-y-8'>
                        <div className='text-center'>
                            <h2 className='text-3xl font-bold tracking-tight'>
                                Latest Public Notes
                            </h2>
                            <p className='text-muted-foreground mt-2'>
                                Discover what others are sharing.
                            </p>
                        </div>
                        <div className='mt-8'>
                            {/* Passing visible params to fetch only public notes */}
                            <PublicNoteList />
                        </div>
                    </div>
                </section>
            </main>

            <footer className='border-t border-border/40 py-8 text-center text-sm text-muted-foreground'>
                © 2026 NoteGAE. All rights reserved.
            </footer>
        </div>
    );
}

function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className='p-6 rounded-2xl bg-background border border-border/50 shadow-sm'>
            <div className='h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4'>
                {icon}
            </div>
            <h3 className='text-xl font-semibold mb-2'>{title}</h3>
            <p className='text-muted-foreground'>{description}</p>
        </div>
    );
}

import { useNotes } from '@/features/notes/hooks/use-notes';
import { Loader2 } from 'lucide-react';
import { NoteCard } from '@/features/notes/components/NoteCard';

function PublicNoteList() {
    const { data, isLoading } = useNotes({ visibility: 'public', limit: 8 });

    if (isLoading) {
        return (
            <div className='flex justify-center p-8'>
                <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
            </div>
        );
    }

    if (!data?.items?.length) return null;

    return (
        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
            {data.items.map((note) => (
                <NoteCard key={note.id} note={note} />
            ))}
        </div>
    );
}
