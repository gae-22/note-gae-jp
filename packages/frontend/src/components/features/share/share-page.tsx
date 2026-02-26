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
      const res = await fetch(`/api/notes/${noteJson.data?.notes?.[0]?.id}?token=${token}`, {
        credentials: 'include',
      });
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
      const res = await fetch(`/api/comments/note/${noteData!.note.id}?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ authorName, body: commentBody }),
      });
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
      <div className="bg-void-900 flex min-h-screen items-center justify-center">
        <div className="text-void-300">Loading...</div>
      </div>
    );
  }

  const { note } = noteData;
  const comments_ = commentsData?.comments ?? [];

  return (
    <div className="bg-void-900 min-h-screen">
      {/* Header */}
      <header className="bg-void-800 flex h-12 items-center border-b border-[rgba(255,255,255,0.06)] px-6">
        <div className="flex items-center gap-2">
          <LuDiamond className="text-accent-500" size={18} />
          <span className="font-heading text-void-50 text-sm font-bold">note.gae</span>
        </div>
        <span className="text-void-300 ml-auto text-xs">Shared with you</span>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-heading text-void-50 mb-3 text-2xl font-bold">
          {note.title || 'Untitled'}
        </h1>

        {note.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {note.tags.map((tag) => (
              <span
                key={tag.id}
                className="bg-accent-glow text-accent-500 rounded-full px-2 py-0.5 text-xs"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        <p className="text-void-300 mb-8 text-xs">Shared by gae</p>

        {/* Rendered note content */}
        <div className="prose prose-invert max-w-none border-t border-[rgba(255,255,255,0.06)] pt-8">
          <div
            dangerouslySetInnerHTML={{
              __html: simpleMarkdownToHtml(note.content),
            }}
          />
        </div>

        {/* Comments */}
        <div className="mt-12 border-t border-[rgba(255,255,255,0.06)] pt-8">
          <h2 className="font-heading text-void-50 mb-6 flex items-center gap-2 text-lg font-semibold">
            <LuMessageSquare size={18} />
            Comments ({comments_.length})
          </h2>

          <div className="mb-8 space-y-4">
            {comments_.map((c) => (
              <div key={c.id} className="bg-void-700 rounded-lg p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-void-50 text-sm font-medium">{c.authorName}</span>
                  <span className="text-void-300 text-xs">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-void-100 text-sm">{c.body}</p>
              </div>
            ))}
          </div>

          {/* Comment form */}
          <div className="bg-void-700 space-y-3 rounded-lg p-4">
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Your Name"
              className="bg-void-600 text-void-50 placeholder:text-void-300 focus:border-accent-500 w-full rounded-md border border-[rgba(255,255,255,0.06)] px-3 py-2 text-sm transition-colors focus:outline-none"
            />
            <textarea
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Write a comment..."
              rows={3}
              className="bg-void-600 text-void-50 placeholder:text-void-300 focus:border-accent-500 w-full resize-none rounded-md border border-[rgba(255,255,255,0.06)] px-3 py-2 text-sm transition-colors focus:outline-none"
            />
            <div className="flex justify-end">
              <button
                onClick={() => addComment.mutate()}
                disabled={!authorName || !commentBody || addComment.isPending}
                className="bg-accent-500 text-void-900 hover:bg-accent-400 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
              >
                <LuSend size={14} />
                Add Comment
              </button>
            </div>
          </div>
        </div>

        <footer className="text-void-300 mt-12 text-center text-xs">© 2026 gae</footer>
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
