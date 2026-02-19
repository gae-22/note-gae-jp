import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rpc } from '@/lib/rpc';
import { toast } from 'sonner';
import type { Note } from './use-notes';

export function useNote(noteId: string) {
    return useQuery({
        queryKey: ['notes', noteId],
        queryFn: async () => {
            const res = await rpc.notes[':id'].$get({
                param: { id: noteId },
            });
            if (!res.ok) {
                throw new Error('Failed to fetch note');
            }
            const json = await res.json();
            return (json.data ?? json) as Note;
        },
        enabled: !!noteId,
    });
}

export function useUpdateNote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: string;
            data: Partial<Note>;
        }) => {
            const res = await rpc.notes[':id'].$patch({
                param: { id },
                json: {
                    title: data.title,
                    contentMarkdown: data.contentMarkdown,
                    visibility: data.visibility,
                },
            });
            if (!res.ok) {
                throw new Error('Failed to update note');
            }
            const json = await res.json();
            return (json.data ?? json) as Note;
        },
        onSuccess: (updatedNote) => {
            queryClient.invalidateQueries({
                queryKey: ['notes', updatedNote.id],
            });
            queryClient.invalidateQueries({ queryKey: ['notes'] });
        },
        onError: () => {
            toast.error('Failed to save note');
        },
    });
}
