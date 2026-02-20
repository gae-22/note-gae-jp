import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { rpc } from '@/lib/rpc';
import { Sidebar } from '@/components/layout/sidebar';

export const Route = createFileRoute('/_auth')({
    beforeLoad: async () => {
        const res = await rpc.auth.me.$get();
        if (!res.ok) {
            throw redirect({
                to: '/login',
            });
        }
        const json = await res.json();
        if (!json.success || !json.data.user) {
            throw redirect({
                to: '/login',
            });
        }
    },
    component: AuthLayout,
});

import { MobileNav } from '@/components/layout/mobile-nav';
import { useGlobalShortcuts } from '@/hooks/use-global-shortcuts';

function AuthLayout() {
    useGlobalShortcuts();

    return (
        <div className='flex min-h-screen flex-col md:flex-row'>
            <MobileNav />
            <Sidebar />
            <main className='flex-1 p-4 md:p-6 overflow-x-hidden'>
                <Outlet />
            </main>
        </div>
    );
}
