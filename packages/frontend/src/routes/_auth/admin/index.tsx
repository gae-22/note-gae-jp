import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useNotes, useCreateNote } from '@/features/notes/hooks/use-notes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { NoteCard } from '@/features/notes/components/NoteCard';

export const Route = createFileRoute('/_auth/admin/')({
    component: Index,
});

function Index() {
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    const {
        data: notesData,
        isLoading,
        error,
    } = useNotes({
        page,
        limit: 20,
        q: debouncedQuery || undefined,
    });
    const createNote = useCreateNote();

    // Simple debounce for search
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setPage(1);
        // Use a timeout to debounce
        const timeout = setTimeout(() => {
            setDebouncedQuery(value);
        }, 400);
        return () => clearTimeout(timeout);
    };

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
            {/* Header */}
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

            {/* Search */}
            <div className='relative max-w-md'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400' />
                <Input
                    id='search-input'
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder='Search notes... (Ctrl+K)'
                    className='pl-10'
                />
            </div>

            {/* Note Grid */}
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                {notesData?.items.length === 0 ? (
                    <div className='col-span-full text-center py-12 border rounded-lg border-dashed text-stone-500'>
                        {debouncedQuery
                            ? `No notes found for "${debouncedQuery}"`
                            : 'No notes found. Create your first note!'}
                    </div>
                ) : (
                    notesData?.items.map((note, index) => (
                        <motion.div
                            key={note.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                            <NoteCard note={note} />
                        </motion.div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {notesData && notesData.total > notesData.limit && (
                <div className='flex items-center justify-center gap-4 pt-4'>
                    <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        <ChevronLeft className='h-4 w-4 mr-1' />
                        Previous
                    </Button>
                    <span className='text-sm text-stone-500'>
                        Page {page} of{' '}
                        {Math.ceil(notesData.total / notesData.limit)}
                    </span>
                    <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setPage((p) => p + 1)}
                        disabled={!notesData.hasNext}
                    >
                        Next
                        <ChevronRight className='h-4 w-4 ml-1' />
                    </Button>
                </div>
            )}
        </div>
    );
}
