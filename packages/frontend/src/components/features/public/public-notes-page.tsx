import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { api } from '@/lib/api-client';
import type { NoteListItem, PaginationMeta } from '@note-gae/shared';
import { LuDiamond, LuFileText, LuArrowRight } from 'react-icons/lu';
import { useState } from 'react';

export function PublicNotesPage() {
  const [page, setPage] = useState(1);

  const { data } = useQuery({
    queryKey: ['public', 'notes', page],
    queryFn: () =>
      api.get<{
        notes: Omit<NoteListItem, 'content'>[];
        pagination: PaginationMeta;
      }>(`/public/notes?page=${page}`),
  });

  const notes = data?.notes ?? [];
  const pagination = data?.pagination;

  return (
    <div className="bg-void-900 min-h-screen">
      {/* Header */}
      <header className="bg-void-800 flex h-12 items-center border-b border-[rgba(255,255,255,0.06)] px-6">
        <div className="flex items-center gap-2">
          <LuDiamond className="text-accent-500" size={18} />
          <span className="font-heading text-void-50 text-sm font-bold">note.gae</span>
        </div>
        <Link
          to="/login"
          className="text-void-300 hover:text-void-100 ml-auto flex items-center gap-1 text-xs transition-colors"
        >
          Login <LuArrowRight size={12} />
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-heading text-void-50 mb-8 text-2xl font-bold">Public Notes by gae</h1>

        <div className="space-y-3">
          {notes.map((note) => (
            <Link
              key={note.id}
              to="/notes/$noteId"
              params={{ noteId: note.id }}
              className="bg-void-700 hover:border-accent-500/30 block rounded-xl border border-[rgba(255,255,255,0.06)] p-4 transition-all duration-200"
            >
              <div className="flex items-start gap-2">
                <LuFileText size={16} className="text-void-300 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-heading text-void-50 text-lg font-semibold">
                    {note.title || 'Untitled'}
                  </h3>
                  {note.tags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
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
                  <p className="text-void-300 mt-2 text-xs">
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {notes.length === 0 && (
          <div className="text-void-300 py-20 text-center">
            <LuFileText size={32} className="text-void-400 mx-auto mb-3" />
            <p>No public notes yet.</p>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4 text-sm">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="text-void-200 hover:text-void-50 transition-colors disabled:opacity-30"
            >
              ← Previous
            </button>
            <span className="text-void-300">
              Page {page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination!.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="text-void-200 hover:text-void-50 transition-colors disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        )}

        <footer className="text-void-300 mt-12 text-center text-xs">© 2026 gae</footer>
      </main>
    </div>
  );
}
