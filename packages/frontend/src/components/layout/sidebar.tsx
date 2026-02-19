import { Link, useRouter } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { LogOut, Plus, Loader2, Library, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { rpc } from '@/lib/rpc';
import { useCreateNote } from '@/features/notes/hooks/use-notes';
import { motion } from 'framer-motion';

export function Sidebar({ className }: { className?: string }) {
    const router = useRouter();
    const createNote = useCreateNote();

    const handleLogout = async () => {
        await rpc.auth.logout.$post();
        await router.invalidate();
        await router.navigate({ to: '/login' });
    };

    return (
        <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
                'w-72 border-r border-border/40 bg-background/60 backdrop-blur-2xl flex flex-col h-screen sticky top-0 z-30',
                'bg-linear-to-b from-background/80 to-background/40',
                className,
            )}
        >
            {/* Ambient Background Glow */}
            <div className='absolute top-0 left-0 w-full h-32 bg-primary/5 blur-3xl -z-10' />
            <div className='absolute bottom-0 right-0 w-full h-32 bg-secondary/5 blur-3xl -z-10' />

            <div className='p-6 pb-2'>
                <Link
                    to='/'
                    className='flex items-center gap-3 group px-2 py-1'
                >
                    <div className='relative'>
                        <div className='absolute inset-0 bg-primary/20 blur-lg rounded-lg group-hover:bg-primary/30 transition-all duration-500' />
                        <div className='bg-primary/10 p-2.5 rounded-xl border border-primary/10 relative backdrop-blur-sm group-hover:scale-105 transition-transform duration-300'>
                            <Sparkles className='h-5 w-5 text-primary' />
                        </div>
                    </div>
                    <div className='flex flex-col'>
                        <span className='font-bold text-lg tracking-tight bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/70'>
                            NoteGAE
                        </span>
                        <span className='text-[10px] text-muted-foreground font-medium tracking-widest uppercase opacity-70'>
                            Workspace
                        </span>
                    </div>
                </Link>
            </div>

            <div className='p-4'>
                <Button
                    onClick={() => createNote.mutate()}
                    disabled={createNote.isPending}
                    className='w-full justify-start shadow-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group border border-primary/10 bg-linear-to-r from-primary/10 to-transparent hover:from-primary/15'
                    variant='ghost'
                    size='lg'
                >
                    <div className='bg-primary/10 p-1.5 rounded-md mr-3 group-hover:scale-110 transition-transform'>
                        {createNote.isPending ? (
                            <Loader2 className='h-4 w-4 animate-spin text-primary' />
                        ) : (
                            <Plus className='h-4 w-4 text-primary' />
                        )}
                    </div>
                    <span className='font-medium text-primary/90'>
                        New Note
                    </span>
                </Button>
            </div>

            <div className='px-4 py-2 flex-1 overflow-y-auto space-y-6'>
                <div>
                    <h2 className='mb-3 px-2 text-[10px] font-bold tracking-widest text-muted-foreground/60 uppercase select-none'>
                        Navigation
                    </h2>
                    <div className='space-y-1'>
                        <Button
                            variant='ghost'
                            className={cn(
                                'w-full justify-start h-10 px-3 relative overflow-hidden',
                                'hover:bg-accent/50 transition-all duration-300',
                            )}
                            asChild
                        >
                            <Link
                                to='/'
                                activeProps={{
                                    className:
                                        'bg-accent/60 text-accent-foreground font-medium',
                                }}
                            >
                                <Library className='mr-3 h-4 w-4 opacity-70' />
                                <span className='flex-1'>All Notes</span>
                            </Link>
                        </Button>
                        {/* Placeholder for future links like "Favorites", "Tags", "Trash" */}
                    </div>
                </div>
            </div>

            <div className='p-4 border-t border-border/40 bg-linear-to-t from-background/80 to-transparent backdrop-blur-sm'>
                <div className='space-y-2'>
                    <div className='flex items-center justify-between px-3 py-2 text-sm text-muted-foreground bg-accent/20 rounded-lg border border-border/50'>
                        <span className='text-xs font-medium'>Appearance</span>
                        <ModeToggle />
                    </div>
                    <Button
                        variant='ghost'
                        className='w-full justify-start text-xs text-muted-foreground hover:text-red-500 hover:bg-red-500/5 transition-colors h-9 px-3'
                        onClick={handleLogout}
                    >
                        <LogOut className='mr-3 h-3.5 w-3.5 opacity-70' />
                        Sign Out
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
