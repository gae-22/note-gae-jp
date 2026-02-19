import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rpc } from '@/lib/rpc';
import { useRouter } from '@tanstack/react-router';
import type {
    listNotesResponseSchema,
    noteResponseSchema,
} from '@note-gae-jp/shared';
import type { z } from 'zod';

export type Note = z.infer<typeof noteResponseSchema>;
export type NoteList = z.infer<typeof listNotesResponseSchema>;

export function useNotes(page = 1, limit = 20) {
    return useQuery({
        queryKey: ['notes', page, limit],
        queryFn: async () => {
            const res = await rpc.notes.$get({
                query: {
                    page: page.toString(),
                    limit: limit.toString(),
                },
            });
            if (!res.ok) {
                throw new Error('Failed to fetch notes');
            }
            return (await res.json()) as NoteList;
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
                    contentBlocks: [], // Empty blocks
                    visibility: 'private',
                },
            });
            if (!res.ok) {
                throw new Error('Failed to create note');
            }
            return (await res.json()) as Note;
        },
        onSuccess: (newNote) => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
            router.navigate({
                to: '/notes/$noteId',
                params: { noteId: newNote.id },
            });
        },
    });
}
