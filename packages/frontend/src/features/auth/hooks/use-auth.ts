import { useQuery } from '@tanstack/react-query';
import { rpc } from '@/lib/rpc';

export function useAuth() {
    return useQuery({
        queryKey: ['auth', 'me'],
        queryFn: async () => {
            const res = await rpc.auth.me.$get();
            if (!res.ok) {
                return null;
            }
            const data = await res.json();
            return data.user;
        },
        retry: false,
    });
}
