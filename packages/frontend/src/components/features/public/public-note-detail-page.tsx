import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Link } from '@tanstack/react-router';
import type { NoteListItem } from '@note-gae/shared';
import { LuDiamond, LuArrowLeft } from 'react-icons/lu';

export function PublicNoteDetailPage() {
    const { noteId } = useParams({ from: '/notes/$noteId' });

    const { data, isLoading, isError } = useQuery({
        queryKey: ['public', 'notes', noteId],
        queryFn: () =>
            api.get<{ note: NoteListItem }>(`/public/notes/${noteId}`),
    });

    if (isLoading) {
        return (
            <div className='min-h-screen bg-void-900 flex items-center justify-center'>
                <span className='text-void-300'>Loading...</span>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className='min-h-screen bg-void-900 flex items-center justify-center'>
                <span className='text-void-300'>Note not found</span>
            </div>
        );
    }

    const { note } = data;

    return (
        <div className='min-h-screen bg-void-900'>
            <header className='h-12 bg-void-800 border-b border-[rgba(255,255,255,0.06)] flex items-center px-6'>
                <div className='flex items-center gap-2'>
                    <LuDiamond className='text-accent-500' size={18} />
                    <span className='font-heading font-bold text-sm text-void-50'>
                        note.gae
                    </span>
                </div>
                <span className='ml-auto text-xs text-void-300'>
                    Public Note
                </span>
            </header>

            <main className='max-w-3xl mx-auto px-6 py-10'>
                <Link
                    to='/'
                    className='inline-flex items-center gap-1 text-sm text-void-300 hover:text-void-100 mb-6 transition-colors'
                >
                    <LuArrowLeft size={14} />
                    Back to notes
                </Link>

                <h1 className='font-heading text-2xl font-bold text-void-50 mb-3'>
                    {note.title || 'Untitled'}
                </h1>

                {note.tags.length > 0 && (
                    <div className='flex gap-1.5 flex-wrap mb-3'>
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

                <p className='text-xs text-void-300 mb-8'>
                    {new Date(note.updatedAt).toLocaleDateString()}
                </p>

                <div className='prose prose-invert max-w-none border-t border-[rgba(255,255,255,0.06)] pt-8'>
                    <div
                        dangerouslySetInnerHTML={{
                            __html: simpleMarkdownToHtml(note.content),
                        }}
                    />
                </div>

                <footer className='mt-12 text-center text-xs text-void-300'>
                    © 2026 gae
                </footer>
            </main>
        </div>
    );
}

function simpleMarkdownToHtml(md: string): string {
    return md
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(
            /`(.+?)`/g,
            '<code style="background:var(--color-void-700);padding:2px 6px;border-radius:4px;">$1</code>',
        )
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/\n/g, '<br />');
}
