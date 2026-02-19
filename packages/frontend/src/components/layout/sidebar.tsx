import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { FileText, LogOut, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { rpc } from '@/lib/rpc';
import { useRouter } from '@tanstack/react-router';

export function Sidebar({ className }: { className?: string }) {
    const router = useRouter();

    const handleLogout = async () => {
        await rpc.auth.logout.$post();
        await router.invalidate();
        await router.navigate({ to: '/login' });
    };

    return (
        <div
            className={cn(
                'pb-12 min-h-screen border-r bg-gray-100/40 dark:bg-stone-800/40 hidden md:block w-[250px]',
                className,
            )}
        >
            <div className='space-y-4 py-4'>
                <div className='px-3 py-2'>
                    <h2 className='mb-2 px-4 text-lg font-semibold tracking-tight'>
                        Notes App
                    </h2>
                    <div className='space-y-1'>
                        <Button
                            variant='secondary'
                            className='w-full justify-start'
                        >
                            <Plus className='mr-2 h-4 w-4' />
                            New Note
                        </Button>
                    </div>
                </div>
                <div className='px-3 py-2'>
                    <h2 className='mb-2 px-4 text-lg font-semibold tracking-tight'>
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
                <div className='px-3 py-2'>
                    <div className='space-y-1'>
                        <Button
                            variant='ghost'
                            className='w-full justify-start text-red-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950'
                            onClick={handleLogout}
                        >
                            <LogOut className='mr-2 h-4 w-4' />
                            Logout
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
