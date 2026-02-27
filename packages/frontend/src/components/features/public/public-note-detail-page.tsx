import { useState, useEffect } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { renderMarkdown } from '@/lib/markdown';
import type { NoteListItem } from '@note-gae/shared';
import { LuArrowLeft, LuFileCode, LuCalendar, LuLoader } from 'react-icons/lu';
import { GrainOverlay, MeshGradient } from '../../ui/decorative';

export function PublicNoteDetailPage() {
  const { noteId } = useParams({ from: '/notes/$noteId' });
  const [previewHtml, setPreviewHtml] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public', 'notes', noteId],
    queryFn: () => api.get<{ note: NoteListItem }>(`/public/notes/${noteId}`),
  });

  useEffect(() => {
    if (data?.note?.content) {
      renderMarkdown(data.note.content).then(setPreviewHtml);
    }
  }, [data?.note?.content]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400 animate-pulse">
          <LuLoader size={16} className="animate-spin text-indigo-500" />
          <span className="font-mono text-sm tracking-widest">Loading document...</span>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center relative overflow-hidden px-6">
        <div className="fixed inset-0 pointer-events-none"><MeshGradient /></div>
        <div className="relative z-10 text-center max-w-sm mx-auto">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            <LuFileCode size={28} className="opacity-50 text-zinc-400" />
          </div>
          <h1 className="font-heading font-bold text-lg text-zinc-900 dark:text-zinc-50 mb-2">Document Not Found</h1>
          <p className="text-zinc-500 text-sm mb-8">The requested document does not exist or is not publicly available.</p>
          <Link to="/" className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all">
            <LuArrowLeft size={14} />
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const { note } = data;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-body text-zinc-900 dark:text-zinc-50 transition-colors duration-500">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none"><MeshGradient /></div>
      <GrainOverlay opacity={0.12} />

      {/* Sticky Header */}
      <header className="sticky top-0 z-30 w-full border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-2xl backdrop-saturate-150">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <LuArrowLeft size={16} className="text-zinc-400 group-hover:text-indigo-500 transition-colors" />
            <span className="font-heading font-semibold text-sm text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">Archive</span>
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 hidden sm:block">Public Document</span>
        </div>
        <div className="h-px bg-linear-to-r from-transparent via-indigo-500/25 to-transparent" />
      </header>

      {/* Article */}
      <main className="relative z-10 mx-auto max-w-4xl px-6 lg:px-8 py-16 md:py-24">
        {/* Header */}
        <div className="mb-12 animate-reveal">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] mb-6">
            {note.title || 'Untitled Document'}
          </h1>

          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {note.tags.map((tag) => (
                <span key={tag.id} className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-400 px-3 py-1 rounded-lg">
                  #{tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-6 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm p-4">
            <span className="font-mono text-xs text-zinc-500 flex items-center gap-2">
              <LuCalendar size={14} className="text-indigo-500/60" />
              {new Date(note.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            {note.commentCount > 0 && (
              <span className="font-mono text-xs text-zinc-500 pl-6 border-l border-zinc-200 dark:border-zinc-700">
                {note.commentCount} Comments
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <article
          className="prose-void animate-reveal rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-8 sm:p-10 md:p-12 relative overflow-hidden shadow-sm"
          style={{ animationDelay: '80ms' }}
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-indigo-500/30 to-transparent" />
          <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </article>

        {/* Footer */}
        <footer className="mt-20 border-t border-zinc-200 dark:border-zinc-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] font-mono text-zinc-400 tracking-wider">
          <span>note.gae // 2026</span>
          <Link to="/" className="hover:text-indigo-500 transition-colors">Return Home</Link>
        </footer>
      </main>
    </div>
  );
}
