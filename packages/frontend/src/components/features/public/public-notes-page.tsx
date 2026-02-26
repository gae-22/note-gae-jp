import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { api } from '@/lib/api-client';
import type { NoteListItem, PaginationMeta } from '@note-gae/shared';
import { LuChevronLeft, LuChevronRight, LuArrowRight, LuFileText } from 'react-icons/lu';
import { DotGridPattern, AmbientGlow } from '../../ui/decorative';

export function PublicNotesPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['public', 'notes', page],
    queryFn: () =>
      api.get<{ notes: NoteListItem[]; pagination: PaginationMeta }>(
        `/public/notes?page=${page}&limit=12`,
      ),
  });

  const notes = data?.notes ?? [];
  const pagination = data?.pagination;

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen relative overflow-hidden font-body text-zinc-900 dark:text-zinc-50 selection:bg-indigo-500/20 selection:text-indigo-700 dark:selection:text-indigo-300 transition-colors duration-300">
      <DotGridPattern className="opacity-40 dark:opacity-20 text-zinc-300 dark:text-zinc-800" />
      <AmbientGlow className="top-[-10%] left-[-10%] w-125 h-125 opacity-30 bg-indigo-500/10 dark:opacity-20" />
      <AmbientGlow className="top-[30%] right-[-10%] w-100 h-100 bg-blue-500/5 opacity-50 dark:opacity-10" />

      {/* Header */}
      <header className="relative z-10 flex h-16 items-center justify-between px-6 md:px-12 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          <span className="font-heading font-bold text-xl tracking-tight text-zinc-900 dark:text-zinc-50">note.gae</span>
        </div>
        <div className="font-mono text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400 flex items-center gap-4 sm:gap-6">
          <span className="hidden sm:inline-block">Status: Online</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Public Archive</span>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-6 md:px-12 py-16 md:py-24">
        {/* Minimal Hero Section */}
        <div className="mb-20 max-w-3xl animate-reveal">
          <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-zinc-900 dark:text-zinc-50">
            Digital Notes &<br /> Thoughts.
          </h1>
          <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
            A minimalist space for documenting engineering, ideas, and system architecture. Designed for clarity and focus.
          </p>
        </div>

        {/* Notes Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-12 animate-reveal" style={{ animationDelay: '100ms' }}>
          <h2 className="font-heading text-xl md:text-2xl font-semibold tracking-tight flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
            Latest Entries
          </h2>
          <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 tracking-wider">
            {pagination ? `${pagination.total} Records` : 'Scanning...'}
          </span>
        </div>

        {/* Clean Note List */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-400 font-mono text-sm animate-pulse space-y-4">
            <LuFileText size={32} className="opacity-50" />
            <span>Loading entries...</span>
          </div>
        ) : notes.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-400 font-mono text-sm space-y-4">
            <LuFileText size={32} className="opacity-50" />
            <span>No records found.</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notes.map((note, idx) => (
                <Link
                  key={note.id}
                  to="/notes/$noteId"
                  params={{ noteId: note.id }}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 transition-all duration-300 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:-translate-y-1 animate-reveal`}
                  style={{ animationDelay: `${Math.min(idx * 50 + 150, 600)}ms` }}
                >
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 font-mono text-[10px] sm:text-xs text-zinc-600 dark:text-zinc-400">
                        {new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <h3 className="font-heading text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug line-clamp-3">
                      {note.title || 'Untitled'}
                    </h3>
                  </div>

                  {/* Bottom Meta & Tags */}
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
                    <div className="flex flex-wrap gap-1.5">
                      {note.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag.id}
                          className="font-mono text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded transition-colors"
                        >
                          #{tag.name}
                        </span>
                      ))}
                      {note.tags.length > 3 && (
                        <span className="font-mono text-[10px] text-zinc-400 px-1 py-0.5">+{note.tags.length - 3}</span>
                      )}
                    </div>

                    <div className="flex items-center text-zinc-400 group-hover:text-indigo-500 transition-colors">
                      <LuArrowRight size={16} className="-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination Segment */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-16 flex items-center justify-center gap-4 font-mono text-sm animate-reveal" style={{ animationDelay: '500ms' }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all disabled:opacity-40"
                >
                  <LuChevronLeft size={16} />
                </button>
                <div className="tracking-widest text-zinc-500">
                  <span className="text-zinc-900 dark:text-zinc-50 font-semibold">{page}</span> / {pagination.totalPages}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all disabled:opacity-40"
                >
                  <LuChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}

        <footer className="mt-24 border-t border-zinc-200 dark:border-zinc-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-zinc-500 transition-colors">
          <span>© 2026 gae. All rights reserved.</span>
          <span>Designed for focus.</span>
        </footer>
      </main>
    </div>
  );
}
