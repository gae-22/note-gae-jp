import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { AuthUser } from '@note-gae/shared';
import { useRouter } from '@tanstack/react-router';

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get<{ user: AuthUser }>('/auth/me').then((d) => d.user),
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: (input: { username: string; password: string }) =>
      api.post<{ user: AuthUser }>('/auth/login', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      router.navigate({ to: '/dashboard' });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => {
      queryClient.clear();
      router.navigate({ to: '/login' });
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    loginError: loginMutation.error?.message,
    loginPending: loginMutation.isPending,
    logout: logoutMutation.mutateAsync,
  };
}
