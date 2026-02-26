import { useState, useEffect } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { renderMarkdown } from '@/lib/markdown';
import type { NoteListItem } from '@note-gae/shared';
import { LuArrowLeft, LuFileCode, LuCalendar } from 'react-icons/lu';
import { DotGridPattern, AmbientGlow } from '../../ui/decorative';

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
      <div className="bg-zinc-50 dark:bg-zinc-950 flex min-h-screen items-center justify-center font-mono text-sm tracking-widest text-zinc-400">
        <div className="animate-pulse flex items-center gap-3">
          <div className="h-4 w-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          Loading document...
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-zinc-50 dark:bg-zinc-950 flex min-h-screen flex-col items-center justify-center font-mono text-sm text-zinc-500">
        <LuFileCode size={40} className="mb-4 opacity-50 text-zinc-400" />
        <span className="tracking-widest">ERROR: DOCUMENT_NOT_FOUND</span>
        <Link to="/" className="mt-8 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-2 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm">
          Return Home
        </Link>
      </div>
    );
  }

  const { note } = data;

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen relative font-body text-zinc-900 dark:text-zinc-50 selection:bg-indigo-500/20 selection:text-indigo-700 dark:selection:text-indigo-300 transition-colors duration-300">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <DotGridPattern className="opacity-40 dark:opacity-20 text-zinc-300 dark:text-zinc-800" />
      </div>

      {/* Modern Header */}
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between px-4 md:px-8 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-2 group">
          <LuArrowLeft size={16} className="text-zinc-400 group-hover:text-indigo-500 transition-colors" />
          <span className="font-heading font-semibold text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">Archive</span>
        </Link>
        <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 hidden sm:block">
          Public Document View
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-6 sm:px-8 py-12 md:py-20">
        {/* Article Header Container */}
        <div className="mb-16 flex flex-col gap-8 animate-reveal">
          <div>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-5xl font-extrabold tracking-tight leading-[1.2] mb-8 text-zinc-900 dark:text-zinc-50">
              {note.title || 'Untitled Document'}
            </h1>

            {/* Tags */}
            {note.tags && note.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {note.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="font-mono text-xs bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 px-2.5 py-1 rounded-md"
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Meta Information Side */}
          <div className="flex items-center gap-6 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border">
            <div>
              <span className="font-mono text-xs text-zinc-500 flex items-center gap-2">
                <LuCalendar size={14} className="text-zinc-400" />
                {new Date(note.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            {note.commentCount > 0 && (
              <div className="pl-6 border-l border-zinc-200 dark:border-zinc-800">
                <span className="font-mono text-xs text-zinc-500">
                  {note.commentCount} Comments
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Reading Area */}
        <article className="prose-void relative animate-reveal bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-sm border border-zinc-200 dark:border-zinc-800" style={{ animationDelay: '100ms' }}>
          <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </article>

        <footer className="mt-20 border-t border-zinc-200 dark:border-zinc-800 pt-8 text-center font-mono text-xs text-zinc-400 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span>note.gae // 2026</span>
          <Link to="/" className="hover:text-indigo-500 transition-colors">Return Home</Link>
        </footer>
      </main>
    </div>
  );
}
