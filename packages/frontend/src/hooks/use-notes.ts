import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rpc } from '@/lib/rpc';
import { useRouter } from '@tanstack/react-router';
import { toast } from 'sonner';
import type {
    listNotesResponseSchema,
    noteResponseSchema,
} from '@note-gae-jp/shared';
import type { z } from 'zod';

export type Note = z.infer<typeof noteResponseSchema>;
export type NoteList = z.infer<typeof listNotesResponseSchema>;

export function useNotes(params?: {
    page?: number;
    limit?: number;
    q?: string;
    visibility?: 'private' | 'public' | 'shared';
}) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const q = params?.q;
    const visibility = params?.visibility;

    return useQuery({
        queryKey: ['notes', { page, limit, q, visibility }],
        queryFn: async () => {
            const query: Record<string, string> = {
                page: page.toString(),
                limit: limit.toString(),
            };
            if (q) query.q = q;
            if (visibility) query.visibility = visibility;

            const res = await rpc.notes.$get({ query });
            if (!res.ok) {
                throw new Error('Failed to fetch notes');
            }
            const json = await res.json();
            return (json.data ?? json) as NoteList;
        },
    });
}

export function useCreateNote() {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: async () => {
            const res = await rpc.notes.$post({
                json: {
                    title: 'Untitled Note',
                    contentBlocks: [],
                    visibility: 'private',
                },
            });
            if (!res.ok) {
                throw new Error('Failed to create note');
            }
            const json = await res.json();
            return (json.data ?? json) as Note;
        },
        onSuccess: (newNote) => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
            toast.success('Note created');
            router.navigate({
                to: '/notes/$noteId',
                params: { noteId: newNote.id },
            });
        },
        onError: () => {
            toast.error('Failed to create note');
        },
    });
}

export function useDeleteNote() {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: async (noteId: string) => {
            const res = await rpc.notes[':id'].$delete({
                param: { id: noteId },
            });
            if (!res.ok) {
                throw new Error('Failed to delete note');
            }
            return noteId;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
            toast.success('Note deleted');
            router.navigate({ to: '/' });
        },
        onError: () => {
            toast.error('Failed to delete note');
        },
    });
}
