import { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NoteListItem, Comment } from '@note-gae/shared';
import { renderMarkdown } from '@/lib/markdown';
import { LuDiamond, LuMessageSquare, LuSend } from 'react-icons/lu';

export function SharePage() {
  const { token } = useParams({ from: '/s/$token' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [authorName, setAuthorName] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');

  const { data: noteData, isError } = useQuery({
    queryKey: ['share', token],
    queryFn: async () => {
      const res = await fetch(`/api/notes?token=${token}`, { credentials: 'include' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      const noteId = json.data?.notes?.[0]?.id;
      if (!noteId) throw new Error('Note not found');

      const noteRes = await fetch(`/api/notes/${noteId}?token=${token}`, {
        credentials: 'include',
      });
      const noteData = await noteRes.json();
      if (!noteData.success) throw new Error(noteData.error);
      return noteData.data as { note: NoteListItem };
    },
    retry: false,
  });

  const { data: commentsData } = useQuery({
    queryKey: ['comments', noteData?.note?.id],
    queryFn: () =>
      fetch(`/api/comments/note/${noteData!.note.id}?token=${token}`, { credentials: 'include' })
        .then((r) => r.json())
        .then((d) => d.data as { comments: Comment[] }),
    enabled: !!noteData?.note?.id,
  });

  // Render markdown
  useEffect(() => {
    if (noteData?.note?.content) {
      renderMarkdown(noteData.note.content).then(setPreviewHtml);
    }
  }, [noteData?.note?.content]);

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
      queryClient.invalidateQueries({ queryKey: ['comments', noteData?.note?.id] });
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
      <header className="border-glass-border bg-void-800 flex h-12 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <LuDiamond className="text-accent-500" size={18} />
          <span className="font-heading text-void-50 text-sm font-bold">note.gae</span>
        </div>
        <span className="text-void-300 ml-auto text-xs">Shared with you</span>
      </header>

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

        <div className="prose-void border-glass-border border-t pt-8">
          <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </div>

        {/* Comments */}
        <div className="border-glass-border mt-12 border-t pt-8">
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

          <div className="bg-void-700 space-y-3 rounded-lg p-4">
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Your Name"
              className="border-glass-border bg-void-600 text-void-50 placeholder:text-void-300 focus:border-accent-500 w-full rounded-md border px-3 py-2 text-sm transition-colors focus:outline-none"
            />
            <textarea
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Write a comment..."
              rows={3}
              className="border-glass-border bg-void-600 text-void-50 placeholder:text-void-300 focus:border-accent-500 w-full resize-none rounded-md border px-3 py-2 text-sm transition-colors focus:outline-none"
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
