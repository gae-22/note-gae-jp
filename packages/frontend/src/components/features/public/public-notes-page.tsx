import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { api } from '@/lib/api-client';
import { renderMarkdown } from '@/lib/markdown';
import type { NoteListItem, PaginationMeta } from '@note-gae/shared';
import { LuDiamond, LuFileText, LuChevronLeft, LuChevronRight, LuGlobe } from 'react-icons/lu';

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
    <div className="bg-void-900 min-h-screen">
      {/* Header */}
      <header className="border-glass-border bg-void-800 flex h-14 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2">
          <LuDiamond className="text-accent-500" size={20} />
          <span className="font-heading text-void-50 font-bold tracking-tight">note.gae</span>
        </div>
        <div className="text-void-300 flex items-center gap-1 text-xs">
          <LuGlobe size={14} />
          Public Notes
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="font-heading text-void-50 mb-2 text-2xl font-bold">Public Notes</h1>
        <p className="text-void-300 mb-8 text-sm">
          {pagination ? `${pagination.total} notes published` : 'Loading...'}
        </p>

        {isLoading ? (
          <div className="text-void-300 py-20 text-center">Loading...</div>
        ) : notes.length === 0 ? (
          <div className="text-void-300 py-20 text-center">
            <LuFileText size={32} className="text-void-400 mx-auto mb-3" />
            <p>No public notes yet.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
              {notes.map((note) => (
                <Link
                  key={note.id}
                  to="/notes/$noteId"
                  params={{ noteId: note.id }}
                  className="group border-glass-border bg-void-700 hover:border-accent-500/30 rounded-xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="mb-2 flex items-start gap-2">
                    <LuFileText size={16} className="text-void-300 mt-0.5 shrink-0" />
                    <h2 className="font-heading text-void-50 group-hover:text-accent-400 line-clamp-2 text-lg font-semibold transition-colors">
                      {note.title || 'Untitled'}
                    </h2>
                  </div>
                  {note.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
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
                  <p className="text-void-300 mt-3 text-xs">
                    {new Date(note.updatedAt).toLocaleDateString()}
                    {note.commentCount > 0 && ` · ${note.commentCount} comments`}
                  </p>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="border-glass-border bg-void-700 text-void-200 hover:bg-void-600 hover:text-void-50 rounded-lg border p-2 transition-colors disabled:opacity-30"
                >
                  <LuChevronLeft size={16} />
                </button>
                <span className="text-void-200 px-4 text-sm">
                  Page {page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="border-glass-border bg-void-700 text-void-200 hover:bg-void-600 hover:text-void-50 rounded-lg border p-2 transition-colors disabled:opacity-30"
                >
                  <LuChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}

        <footer className="text-void-300 mt-16 text-center text-xs">© 2026 gae</footer>
      </main>
    </div>
  );
}
