import { createFileRoute, redirect } from '@tanstack/react-router';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { rpc } from '@/lib/rpc';

export const Route = createFileRoute('/login')({
    beforeLoad: async () => {
        try {
            const res = await rpc.auth.me.$get();
            if (res.ok) {
                const json = await res.json();
                if (json.data?.user) {
                    throw redirect({ to: '/admin' });
                }
            }
        } catch (e) {
            // Ignore errors (e.g. network error), let user try to login
            if (e instanceof Response) throw e; // Rethrow redirect
        }
    },
    component: LoginForm,
});
