import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { NoteListItem, Comment } from '@note-gae/shared';
import { LuDiamond, LuMessageSquare, LuClock, LuSend } from 'react-icons/lu';

export function SharePage() {
    const { token } = useParams({ from: '/s/$token' });
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [authorName, setAuthorName] = useState('');
    const [commentBody, setCommentBody] = useState('');

    const { data: noteData, isError } = useQuery({
        queryKey: ['share', token],
        queryFn: async () => {
            const noteRes = await fetch(`/api/notes?token=${token}`, {
                credentials: 'include',
            });
            const noteJson = await noteRes.json();
            if (!noteJson.success) throw new Error(noteJson.error);

            // Get note ID from token context — try to get the note details
            const res = await fetch(
                `/api/notes/${noteJson.data?.notes?.[0]?.id}?token=${token}`,
                { credentials: 'include' },
            );
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            return data.data as { note: NoteListItem };
        },
        retry: false,
    });

    const { data: commentsData } = useQuery({
        queryKey: ['comments', noteData?.note?.id],
        queryFn: () =>
            fetch(`/api/comments/note/${noteData!.note.id}?token=${token}`, {
                credentials: 'include',
            })
                .then((r) => r.json())
                .then((d) => d.data as { comments: Comment[] }),
        enabled: !!noteData?.note?.id,
    });

    const addComment = useMutation({
        mutationFn: async () => {
            const res = await fetch(
                `/api/comments/note/${noteData!.note.id}?token=${token}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ authorName, body: commentBody }),
                },
            );
            return res.json();
        },
        onSuccess: () => {
            setCommentBody('');
            queryClient.invalidateQueries({
                queryKey: ['comments', noteData?.note?.id],
            });
        },
    });

    if (isError) {
        navigate({ to: '/s/expired' });
        return null;
    }

    if (!noteData) {
        return (
            <div className='min-h-screen bg-void-900 flex items-center justify-center'>
                <div className='text-void-300'>Loading...</div>
            </div>
        );
    }

    const { note } = noteData;
    const comments_ = commentsData?.comments ?? [];

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
                <span className='ml-auto text-xs text-void-300'>
                    Shared with you
                </span>
            </header>

            {/* Content */}
            <main className='max-w-3xl mx-auto px-6 py-10'>
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

                <p className='text-xs text-void-300 mb-8'>Shared by gae</p>

                {/* Rendered note content */}
                <div className='prose prose-invert max-w-none border-t border-[rgba(255,255,255,0.06)] pt-8'>
                    <div
                        dangerouslySetInnerHTML={{
                            __html: simpleMarkdownToHtml(note.content),
                        }}
                    />
                </div>

                {/* Comments */}
                <div className='mt-12 border-t border-[rgba(255,255,255,0.06)] pt-8'>
                    <h2 className='flex items-center gap-2 font-heading text-lg font-semibold text-void-50 mb-6'>
                        <LuMessageSquare size={18} />
                        Comments ({comments_.length})
                    </h2>

                    <div className='space-y-4 mb-8'>
                        {comments_.map((c) => (
                            <div
                                key={c.id}
                                className='p-4 bg-void-700 rounded-lg'
                            >
                                <div className='flex items-center gap-2 mb-2'>
                                    <span className='text-sm font-medium text-void-50'>
                                        {c.authorName}
                                    </span>
                                    <span className='text-xs text-void-300'>
                                        {new Date(
                                            c.createdAt,
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className='text-sm text-void-100'>
                                    {c.body}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Comment form */}
                    <div className='p-4 bg-void-700 rounded-lg space-y-3'>
                        <input
                            type='text'
                            value={authorName}
                            onChange={(e) => setAuthorName(e.target.value)}
                            placeholder='Your Name'
                            className='w-full px-3 py-2 bg-void-600 border border-[rgba(255,255,255,0.06)] rounded-md text-sm text-void-50 placeholder:text-void-300 focus:outline-none focus:border-accent-500 transition-colors'
                        />
                        <textarea
                            value={commentBody}
                            onChange={(e) => setCommentBody(e.target.value)}
                            placeholder='Write a comment...'
                            rows={3}
                            className='w-full px-3 py-2 bg-void-600 border border-[rgba(255,255,255,0.06)] rounded-md text-sm text-void-50 placeholder:text-void-300 focus:outline-none focus:border-accent-500 transition-colors resize-none'
                        />
                        <div className='flex justify-end'>
                            <button
                                onClick={() => addComment.mutate()}
                                disabled={
                                    !authorName ||
                                    !commentBody ||
                                    addComment.isPending
                                }
                                className='flex items-center gap-2 px-4 py-2 bg-accent-500 text-void-900 text-sm font-medium rounded-lg hover:bg-accent-400 disabled:opacity-50 transition-colors'
                            >
                                <LuSend size={14} />
                                Add Comment
                            </button>
                        </div>
                    </div>
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
