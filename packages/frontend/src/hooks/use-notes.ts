import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { NoteListItem, PaginationMeta } from '@note-gae/shared';

interface UseNotesOptions {
  q?: string;
  tags?: string[];
  isPublic?: boolean;
  sort?: 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export function useNotes(opts: UseNotesOptions = {}) {
  const { enabled = true, ...queryOpts } = opts;

  return useQuery({
    queryKey: ['notes', queryOpts],
    queryFn: () => {
      const params = new URLSearchParams();
      if (queryOpts.q) params.set('q', queryOpts.q);
      if (queryOpts.tags?.length) params.set('tags', queryOpts.tags.join(','));
      if (queryOpts.isPublic !== undefined) params.set('isPublic', queryOpts.isPublic ? '1' : '0');
      if (queryOpts.sort) params.set('sort', queryOpts.sort);
      if (queryOpts.order) params.set('order', queryOpts.order);
      if (queryOpts.page) params.set('page', String(queryOpts.page));
      if (queryOpts.limit) params.set('limit', String(queryOpts.limit));

      return api.get<{ notes: NoteListItem[]; pagination: PaginationMeta }>(
        `/notes?${params.toString()}`,
      );
    },
    enabled,
  });
}

export function useNote(id: string, enabled = true) {
  return useQuery({
    queryKey: ['notes', id],
    queryFn: () => api.get<{ note: NoteListItem }>(`/notes/${id}`),
    enabled,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      title?: string;
      content?: string;
      isPublic?: boolean;
      tagIds?: string[];
    }) => api.post<{ note: { id: string } }>('/notes', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

export function useUpdateNote(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      title?: string;
      content?: string;
      isPublic?: boolean;
      tagIds?: string[];
    }) => api.patch<{ note: NoteListItem }>(`/notes/${id}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/notes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}
