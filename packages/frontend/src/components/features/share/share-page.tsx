import { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NoteListItem, Comment } from '@note-gae/shared';
import { renderMarkdown } from '@/lib/markdown';
import { LuMessageSquare, LuSend, LuLoader } from 'react-icons/lu';
import { GrainOverlay, MeshGradient } from '../../ui/decorative';

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
      const noteRes = await fetch(`/api/notes/${noteId}?token=${token}`, { credentials: 'include' });
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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none"><MeshGradient /></div>
        <div className="relative z-10 flex items-center gap-3 text-zinc-400 animate-pulse">
          <LuLoader size={18} className="animate-spin" />
          <span className="text-sm font-mono tracking-wider">Loading document...</span>
        </div>
      </div>
    );
  }

  const { note } = noteData;
  const comments_ = commentsData?.comments ?? [];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-body relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none"><MeshGradient /></div>
      <GrainOverlay opacity={0.1} />

      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b border-white/6 bg-zinc-950/70 backdrop-blur-2xl backdrop-saturate-150">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.6)]" />
            <span className="font-heading text-sm font-bold tracking-tight">note.gae</span>
          </div>
          <span className="text-zinc-500 text-[10px] font-mono tracking-widest uppercase">Shared with you</span>
        </div>
        <div className="h-px bg-linear-to-r from-transparent via-indigo-500/20 to-transparent" />
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-6 lg:px-8 py-12 md:py-20">
        {/* Title area */}
        <div className="mb-10 animate-reveal">
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-5">
            {note.title || 'Untitled'}
          </h1>
          {note.tags.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-2">
              {note.tags.map((tag) => (
                <span key={tag.id} className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-lg px-2.5 py-1 text-xs font-mono">
                  {tag.name}
                </span>
              ))}
            </div>
          )}
          <p className="text-zinc-500 text-xs font-mono tracking-wider">Shared by gae</p>
        </div>

        {/* Content */}
        <div className="prose-void border-t border-white/6 pt-10 animate-reveal" style={{ animationDelay: '100ms' }}>
          <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </div>

        {/* Comments */}
        <div className="border-t border-white/6 mt-14 pt-10 animate-reveal" style={{ animationDelay: '200ms' }}>
          <h2 className="font-heading mb-8 flex items-center gap-2.5 text-lg font-semibold tracking-tight">
            <LuMessageSquare size={18} className="text-indigo-400" />
            Comments ({comments_.length})
          </h2>

          <div className="mb-8 space-y-4">
            {comments_.map((c, idx) => (
              <div
                key={c.id}
                className="rounded-xl border border-white/6 bg-white/3 backdrop-blur-sm p-5 animate-reveal"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="mb-2.5 flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-300">
                    {c.authorName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-zinc-200">{c.authorName}</span>
                  <span className="text-xs font-mono text-zinc-600">{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm leading-relaxed text-zinc-300 pl-9">{c.body}</p>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="rounded-xl border border-white/6 bg-white/3 backdrop-blur-sm space-y-3 p-5">
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Your Name"
              className="w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-zinc-50 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all hover:border-white/[0.14]"
            />
            <textarea
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Write a comment..."
              rows={3}
              className="w-full resize-none rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-zinc-50 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all hover:border-white/[0.14]"
            />
            <div className="flex justify-end">
              <button
                onClick={() => addComment.mutate()}
                disabled={!authorName || !commentBody || addComment.isPending}
                className="flex items-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_-2px_rgba(99,102,241,0.4)] hover:shadow-[0_6px_20px_-2px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                <LuSend size={14} />
                Add Comment
              </button>
            </div>
          </div>
        </div>

        <footer className="text-zinc-600 mt-16 text-center text-[11px] font-mono tracking-widest">© 2026 gae</footer>
      </main>
    </div>
  );
}
