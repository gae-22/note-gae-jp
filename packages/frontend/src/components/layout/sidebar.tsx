import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { FileText, LogOut, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { rpc } from '@/lib/rpc';
import { useRouter } from '@tanstack/react-router';
import { useCreateNote } from '@/hooks/use-notes';

export function Sidebar({ className }: { className?: string }) {
    const router = useRouter();
    const createNote = useCreateNote();

    const handleLogout = async () => {
        await rpc.auth.logout.$post();
        await router.invalidate();
        await router.navigate({ to: '/login' });
    };

    return (
        <div
            className={cn(
                'w-64 border-r bg-background/60 backdrop-blur-xl flex flex-col h-screen sticky top-0 z-30 transition-all duration-300',
                className,
            )}
        >
            <div className='p-6 border-b border-border/40'>
                <Link to='/' className='flex items-center gap-2 group'>
                    <div className='bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors'>
                        <FileText className='h-6 w-6 text-primary' />
                    </div>
                    <span className='font-bold text-xl tracking-tight bg-clip-text text-transparent bg-linear-to-r from-primary to-primary/70'>
                        NoteGAE
                    </span>
                </Link>
            </div>

            <div className='p-4'>
                <Button
                    onClick={() => createNote.mutate()}
                    disabled={createNote.isPending}
                    className='w-full justify-start shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5'
                    size='lg'
                >
                    {createNote.isPending ? (
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    ) : (
                        <Plus className='mr-2 h-4 w-4' />
                    )}
                    New Note
                </Button>
            </div>

            <div className='px-3 py-2 flex-1 overflow-y-auto'>
                <h2 className='mb-2 px-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase'>
                    Library
                </h2>
                <div className='space-y-1'>
                    <Button
                        variant='ghost'
                        className='w-full justify-start'
                        asChild
                    >
                        <Link to='/'>
                            <FileText className='mr-2 h-4 w-4' />
                            All Notes
                        </Link>
                    </Button>
                </div>
            </div>

            <div className='px-3 py-2 border-t border-border/40'>
                <div className='space-y-1'>
                    <div className='flex items-center justify-between px-4 py-2 text-sm text-muted-foreground'>
                        <span>Theme</span>
                        <ModeToggle />
                    </div>
                    <Button
                        variant='ghost'
                        className='w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20'
                        onClick={handleLogout}
                    >
                        <LogOut className='mr-2 h-4 w-4' />
                        Logout
                    </Button>
                </div>
            </div>
        </div>
    );
}
