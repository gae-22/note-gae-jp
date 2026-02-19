import { useState } from 'react';
import { Link, useRouter } from '@tanstack/react-router';
import {
    LogOut,
    Plus,
    Loader2,
    Library,
    Sparkles,
    Menu,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { rpc } from '@/lib/rpc';
import { useCreateNote } from '@/features/notes/hooks/use-notes';
import { motion, AnimatePresence } from 'framer-motion';

export function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const createNote = useCreateNote();

    const handleLogout = async () => {
        await rpc.auth.logout.$post();
        await router.invalidate();
        await router.navigate({ to: '/login' });
    };

    const toggleOpen = () => setIsOpen(!isOpen);

    return (
        <div className='md:hidden flex flex-col'>
            {/* Mobile Header */}
            <div className='h-14 border-b border-border/40 bg-background/60 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-40'>
                <Link to='/' className='flex items-center gap-2'>
                    <div className='bg-primary/10 p-1.5 rounded-lg border border-primary/10'>
                        <Sparkles className='h-4 w-4 text-primary' />
                    </div>
                    <span className='font-bold text-sm tracking-tight'>
                        NoteGAE
                    </span>
                </Link>
                <Button variant='ghost' size='icon' onClick={toggleOpen}>
                    <Menu className='h-5 w-5' />
                </Button>
            </div>

            {/* Mobile Drawer Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={toggleOpen}
                            className='fixed inset-0 bg-background/80 backdrop-blur-sm z-50'
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{
                                type: 'spring',
                                damping: 25,
                                stiffness: 200,
                            }}
                            className='fixed inset-y-0 left-0 z-50 w-3/4 max-w-sm border-r border-border/40 bg-background shadow-2xl flex flex-col'
                        >
                            <div className='p-4 flex items-center justify-between border-b border-border/40'>
                                <span className='font-bold text-lg'>Menu</span>
                                <Button
                                    variant='ghost'
                                    size='icon'
                                    onClick={toggleOpen}
                                >
                                    <X className='h-5 w-5' />
                                </Button>
                            </div>

                            <div className='p-4 space-y-4 flex-1 overflow-y-auto'>
                                <Button
                                    onClick={() => {
                                        createNote.mutate();
                                        setIsOpen(false);
                                    }}
                                    disabled={createNote.isPending}
                                    className='w-full justify-start'
                                    size='lg'
                                >
                                    {createNote.isPending ? (
                                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                    ) : (
                                        <Plus className='mr-2 h-4 w-4' />
                                    )}
                                    New Note
                                </Button>

                                <div className='space-y-1'>
                                    <h3 className='text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2'>
                                        Navigation
                                    </h3>
                                    <Button
                                        variant='ghost'
                                        className='w-full justify-start'
                                        asChild
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <Link to='/'>
                                            <Library className='mr-2 h-4 w-4' />
                                            All Notes
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            <div className='p-4 border-t border-border/40 bg-muted/20 space-y-4'>
                                <div className='flex items-center justify-between'>
                                    <span className='text-sm font-medium'>
                                        Theme
                                    </span>
                                    <ModeToggle />
                                </div>
                                <Button
                                    variant='ghost'
                                    className='w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20'
                                    onClick={handleLogout}
                                >
                                    <LogOut className='mr-2 h-4 w-4' />
                                    Sign Out
                                </Button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
