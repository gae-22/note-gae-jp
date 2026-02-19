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
    },
    component: AuthLayout,
});

function AuthLayout() {
    return (
        <div className='flex min-h-screen'>
            <Sidebar />
            <main className='flex-1 p-6'>
                <Outlet />
            </main>
        </div>
    );
}
