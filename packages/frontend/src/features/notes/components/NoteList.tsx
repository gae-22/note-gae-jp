import { useNotes } from '../hooks/use-notes';
import { NoteCard } from './NoteCard';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import { useCreateNote } from '../hooks/use-notes';

export function NoteList() {
    // State for simple pagination or filtering could go here
    const { data, isLoading, error } = useNotes();
    const createNote = useCreateNote();

    if (isLoading) {
        return (
            <div className='flex h-64 items-center justify-center'>
                <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
            </div>
        );
    }

    if (error) {
        return (
            <div className='rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive'>
                Failed to load notes. Please try again.
            </div>
        );
    }

    const notes = data?.items ?? [];

    return (
        <div className='space-y-6'>
            <div className='flex items-center justify-between'>
                <h2 className='text-2xl font-bold tracking-tight'>Notes</h2>
                <Button
                    onClick={() => createNote.mutate()}
                    disabled={createNote.isPending}
                    className='gap-2'
                >
                    {createNote.isPending ? (
                        <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                        <Plus className='h-4 w-4' />
                    )}
                    New Note
                </Button>
            </div>

            {notes.length === 0 ? (
                <div className='flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center text-muted-foreground'>
                    <p className='mb-4 text-lg font-medium'>No notes yet</p>
                    <p className='mb-6 text-sm'>
                        Create your first note to get started.
                    </p>
                    <Button
                        onClick={() => createNote.mutate()}
                        variant='outline'
                    >
                        Create Note
                    </Button>
                </div>
            ) : (
                <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                    {notes.map((note) => (
                        <NoteCard key={note.id} note={note} />
                    ))}
                </div>
            )}
        </div>
    );
}
