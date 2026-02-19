import { createFileRoute, Link } from '@tanstack/react-router';
import { useNotes, useCreateNote } from '@/hooks/use-notes';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const Route = createFileRoute('/_auth/')({
    component: Index,
});

function Index() {
    const { data: notesData, isLoading, error } = useNotes();
    const createNote = useCreateNote();

    if (isLoading) {
        return (
            <div className='flex items-center justify-center h-full'>
                <Loader2 className='h-8 w-8 animate-spin text-stone-500' />
            </div>
        );
    }

    if (error) {
        return (
            <div className='flex flex-col items-center justify-center h-full space-y-4'>
                <p className='text-red-500'>Failed to load notes.</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
        );
    }

    return (
        <div className='space-y-6'>
            <div className='flex items-center justify-between'>
                <div>
                    <h1 className='text-3xl font-bold tracking-tight'>Notes</h1>
                    <p className='text-stone-500 dark:text-stone-400'>
                        Manage your personal knowledge base.
                    </p>
                </div>
                <Button
                    onClick={() => createNote.mutate()}
                    disabled={createNote.isPending}
                >
                    {createNote.isPending ? (
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    ) : (
                        <Plus className='mr-2 h-4 w-4' />
                    )}
                    New Note
                </Button>
            </div>

            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                {notesData?.items.length === 0 ? (
                    <div className='col-span-full text-center py-12 border rounded-lg border-dashed text-stone-500'>
                        No notes found. Create your first note!
                    </div>
                ) : (
                    notesData?.items.map((note) => (
                        <Link
                            key={note.id}
                            to='/notes/$noteId'
                            params={{ noteId: note.id }}
                            className='block transition-transform hover:scale-[1.02]'
                        >
                            <Card className='h-full hover:border-stone-400 dark:hover:border-stone-600 transition-colors'>
                                <CardHeader className='pb-2'>
                                    <CardTitle className='line-clamp-1 text-lg'>
                                        {note.title || 'Untitled'}
                                    </CardTitle>
                                    <CardDescription className='text-xs'>
                                        {formatDistanceToNow(
                                            new Date(note.updatedAt),
                                            {
                                                addSuffix: true,
                                            },
                                        )}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className='text-sm text-stone-500 dark:text-stone-400 line-clamp-3'>
                                        {note.contentMarkdown ||
                                            'No preview available'}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
