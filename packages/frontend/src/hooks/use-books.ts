import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export interface Note {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Book {
  id: string;
  title: string;
  description: string;
  slug: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  bookId: string;
  noteId: string;
  title: string;
  order: number;
  note: Note;
  createdAt: string;
  updatedAt: string;
}

export function useBooks(enabled = true) {
  return useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      const data = await api.get<{ books: Book[] }>('/books');
      return data;
    },
    enabled,
  });
}

export function useBook(idOrSlug: string, enabled = true) {
  return useQuery({
    queryKey: ['book', idOrSlug],
    queryFn: async () => {
      const data = await api.get<{ book: Book; chapters: Chapter[] }>(`/books/${idOrSlug}`);
      return data;
    },
    enabled: enabled && !!idOrSlug,
  });
}

export function useCreateBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; description?: string; slug: string; isPublic?: boolean }) => {
      const result = await api.post<{ book: Book }>('/books', data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });
}

export function useUpdateBook(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<{ title: string; description: string; slug: string; isPublic: boolean }>) => {
      const result = await api.put<{ book: Book }>(`/books/${id}`, data);
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['book', id] });
      if (variables.slug) {
        queryClient.invalidateQueries({ queryKey: ['book', variables.slug] });
      }
    },
  });
}

export function useDeleteBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/books/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });
}

export function useAddChapter(bookId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { noteId: string; title?: string }) => {
      const result = await api.post<{ chapter: Chapter }>(`/books/${bookId}/chapters`, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book', bookId] });
    },
  });
}

export function useReorderChapters(bookId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (chapterIds: string[]) => {
      return await api.put(`/books/${bookId}/chapters/reorder`, { chapterIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book', bookId] });
    },
  });
}

export function useRemoveChapter(bookId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (chapterId: string) => {
      return await api.delete(`/books/${bookId}/chapters/${chapterId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book', bookId] });
    },
  });
}
