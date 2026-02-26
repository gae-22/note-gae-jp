import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { api } from '@/lib/api-client';
import type { NoteListItem, PaginationMeta } from '@note-gae/shared';
import { LuDiamond, LuFileText, LuArrowRight } from 'react-icons/lu';
import { useState } from 'react';

export function PublicNotesPage() {
    const [page, setPage] = useState(1);

    const { data } = useQuery({
        queryKey: ['public', 'notes', page],
        queryFn: () =>
            api.get<{
                notes: Omit<NoteListItem, 'content'>[];
                pagination: PaginationMeta;
            }>(`/public/notes?page=${page}`),
    });

    const notes = data?.notes ?? [];
    const pagination = data?.pagination;

    return (
        <div className='min-h-screen bg-void-900'>
            {/* Header */}
            <header className='h-12 bg-void-800 border-b border-[rgba(255,255,255,0.06)] flex items-center px-6'>
                <div className='flex items-center gap-2'>
                    <LuDiamond className='text-accent-500' size={18} />
                    <span className='font-heading font-bold text-sm text-void-50'>
                        note.gae
                    </span>
                </div>
                <Link
                    to='/login'
                    className='ml-auto text-xs text-void-300 hover:text-void-100 flex items-center gap-1 transition-colors'
                >
                    Login <LuArrowRight size={12} />
                </Link>
            </header>

            <main className='max-w-3xl mx-auto px-6 py-10'>
                <h1 className='font-heading text-2xl font-bold text-void-50 mb-8'>
                    Public Notes by gae
                </h1>

                <div className='space-y-3'>
                    {notes.map((note) => (
                        <Link
                            key={note.id}
                            to='/notes/$noteId'
                            params={{ noteId: note.id }}
                            className='block p-4 bg-void-700 border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-accent-500/30 transition-all duration-200'
                        >
                            <div className='flex items-start gap-2'>
                                <LuFileText
                                    size={16}
                                    className='text-void-300 mt-0.5 shrink-0'
                                />
                                <div>
                                    <h3 className='font-heading text-lg font-semibold text-void-50'>
                                        {note.title || 'Untitled'}
                                    </h3>
                                    {note.tags.length > 0 && (
                                        <div className='flex gap-1.5 flex-wrap mt-1.5'>
                                            {note.tags.map((tag) => (
                                                <span
                                                    key={tag.id}
                                                    className='px-2 py-0.5 text-xs rounded-full bg-accent-glow text-accent-500'
                                                >
                                                    {tag.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <p className='mt-2 text-xs text-void-300'>
                                        {new Date(
                                            note.updatedAt,
                                        ).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {notes.length === 0 && (
                    <div className='text-center py-20 text-void-300'>
                        <LuFileText
                            size={32}
                            className='mx-auto mb-3 text-void-400'
                        />
                        <p>No public notes yet.</p>
                    </div>
                )}

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className='flex items-center justify-center gap-4 mt-8 text-sm'>
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className='text-void-200 hover:text-void-50 disabled:opacity-30 transition-colors'
                        >
                            ← Previous
                        </button>
                        <span className='text-void-300'>
                            Page {page} of {pagination.totalPages}
                        </span>
                        <button
                            onClick={() =>
                                setPage((p) =>
                                    Math.min(pagination!.totalPages, p + 1),
                                )
                            }
                            disabled={page >= pagination.totalPages}
                            className='text-void-200 hover:text-void-50 disabled:opacity-30 transition-colors'
                        >
                            Next →
                        </button>
                    </div>
                )}

                <footer className='mt-12 text-center text-xs text-void-300'>
                    © 2026 gae
                </footer>
            </main>
        </div>
    );
}
