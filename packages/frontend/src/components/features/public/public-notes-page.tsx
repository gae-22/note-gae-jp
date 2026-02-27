import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { api } from '@/lib/api-client';
import type { NoteListItem, PaginationMeta } from '@note-gae/shared';
import { LuChevronLeft, LuChevronRight, LuArrowRight, LuFileText, LuPenLine } from 'react-icons/lu';
import { GrainOverlay, MeshGradient } from '../../ui/decorative';

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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-body text-zinc-900 dark:text-zinc-50 transition-colors duration-500">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <MeshGradient />
      </div>
      <GrainOverlay opacity={0.15} className="fixed!" />

      {/* ─── Sticky Glass Header ─── */}
      <header className="sticky top-0 z-30 w-full border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-2xl backdrop-saturate-150">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-glow-pulse" />
            <span className="font-heading font-bold text-lg tracking-tight">note.gae</span>
          </div>
          <nav className="flex items-center gap-6 font-mono text-[11px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            <span className="hidden sm:block">Status: Online</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">Public Archive</span>
          </nav>
        </div>
        {/* Accent gradient underline */}
        <div className="h-px bg-linear-to-r from-transparent via-indigo-500/25 to-transparent" />
      </header>

      {/* ─── Main ─── */}
      <main className="relative z-10 mx-auto max-w-6xl px-6 lg:px-8">

        {/* Hero */}
        <section className="pb-20 pt-20 md:pt-28 md:pb-24 animate-reveal">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200/60 dark:border-indigo-500/20 bg-indigo-50/80 dark:bg-indigo-500/8 px-4 py-1.5">
              <LuPenLine size={13} className="text-indigo-500" />
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide">Digital Archive</span>
            </div>

            <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter leading-[0.92] mb-7">
              Notes &amp;<br />
              <span className="bg-linear-to-r from-indigo-500 via-violet-500 to-indigo-600 bg-clip-text text-transparent">
                Thoughts.
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed">
              A minimalist space for documenting engineering, ideas, and system architecture.
              Designed for clarity and focus.
            </p>
          </div>
        </section>

        {/* Section divider */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-10 animate-reveal" style={{ animationDelay: '80ms' }}>
          <h2 className="font-heading text-lg md:text-xl font-semibold tracking-tight flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Latest Entries
          </h2>
          <span className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500 tracking-wider">
            {pagination ? `${pagination.total} Records` : 'Scanning...'}
          </span>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-zinc-400 animate-pulse">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60">
              <LuFileText size={24} className="opacity-60" />
            </div>
            <span className="font-mono text-xs tracking-widest">Loading entries...</span>
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-zinc-400">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60">
              <LuFileText size={24} className="opacity-60" />
            </div>
            <span className="font-mono text-xs tracking-widest">No records found.</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {notes.map((note, idx) => (
                <Link
                  key={note.id}
                  to="/notes/$noteId"
                  params={{ noteId: note.id }}
                  className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-6 transition-all duration-300 hover:shadow-[0_8px_30px_-8px_rgba(99,102,241,0.12)] hover:border-indigo-200 dark:hover:border-indigo-500/25 hover:-translate-y-1 animate-reveal"
                  style={{ animationDelay: `${Math.min(idx * 50 + 120, 600)}ms` }}
                >
                  {/* Hover accent overlay */}
                  <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-indigo-500/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative mb-5">
                    <span className="inline-block mb-4 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/40 dark:border-zinc-700/40 px-2.5 py-1 font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                      {new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <h3 className="font-heading text-lg font-bold tracking-tight leading-snug line-clamp-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">
                      {note.title || 'Untitled'}
                    </h3>
                  </div>

                  <div className="relative mt-auto flex items-center justify-between gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
                    <div className="flex flex-wrap gap-1.5">
                      {note.tags.slice(0, 3).map((tag) => (
                        <span key={tag.id} className="font-mono text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-md">
                          #{tag.name}
                        </span>
                      ))}
                      {note.tags.length > 3 && (
                        <span className="font-mono text-[10px] text-zinc-400 py-0.5">+{note.tags.length - 3}</span>
                      )}
                    </div>
                    <LuArrowRight
                      size={15}
                      className="text-zinc-300 dark:text-zinc-600 group-hover:text-indigo-500 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 shrink-0"
                    />
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-16 flex items-center justify-center gap-3 font-mono text-sm animate-reveal" style={{ animationDelay: '400ms' }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all disabled:opacity-30"
                >
                  <LuChevronLeft size={16} />
                </button>
                <span className="min-w-16 text-center text-zinc-500">
                  <strong className="text-zinc-900 dark:text-zinc-50">{page}</strong> / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all disabled:opacity-30"
                >
                  <LuChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <footer className="mt-24 mb-8 border-t border-zinc-200 dark:border-zinc-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] font-mono text-zinc-400 dark:text-zinc-500 tracking-wider">
          <span>© 2026 gae. All rights reserved.</span>
          <span>Designed for focus.</span>
        </footer>
      </main>
    </div>
  );
}
