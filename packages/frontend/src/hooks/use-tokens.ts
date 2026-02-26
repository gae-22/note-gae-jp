import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { ShareTokenInfo } from '@note-gae/shared';

export function useShareTokens(noteId: string, enabled = true) {
  return useQuery({
    queryKey: ['tokens', noteId],
    queryFn: () => api.get<{ tokens: ShareTokenInfo[] }>(`/tokens/note/${noteId}`),
    enabled,
  });
}

export function useCreateShareToken(noteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { label?: string; expiresIn?: string }) =>
      api.post<{ token: ShareTokenInfo }>(`/tokens/note/${noteId}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokens', noteId] });
    },
  });
}

export function useRevokeToken(noteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tokenId: string) => api.delete(`/tokens/${tokenId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokens', noteId] });
    },
  });
}
