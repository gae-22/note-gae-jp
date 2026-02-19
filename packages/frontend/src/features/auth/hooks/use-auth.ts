import { useQuery } from '@tanstack/react-query';
import { rpc } from '@/lib/rpc';

export function useAuth() {
    const { data: user, isLoading } = useQuery({
        queryKey: ['auth', 'me'],
        queryFn: async () => {
            const res = await rpc.auth.me.$get();
            if (!res.ok) {
                return null;
            }
            const json = await res.json();
            return json.data?.user;
        },
        retry: false,
    });

    return { user, isLoading, isAuthenticated: !!user };
}
