import { createFileRoute, redirect } from '@tanstack/react-router';
import { rpc } from '@/lib/rpc';

export const Route = createFileRoute('/')({
    beforeLoad: async () => {
        const res = await rpc.auth.me.$get();
        if (!res.ok) {
            throw redirect({
                to: '/login',
            });
        }
    },
    component: Index,
});

function Index() {
    return (
        <div className='p-4'>
            <h1 className='text-2xl font-bold mb-4'>Notes</h1>
            <p>Welcome to your notes app.</p>
        </div>
    );
}
