import { useState, useEffect } from 'react';
import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { renderMarkdown } from '@/lib/markdown';
import { Link } from '@tanstack/react-router';
import type { NoteListItem } from '@note-gae/shared';
import { LuDiamond, LuArrowLeft } from 'react-icons/lu';

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
      <div className="bg-void-900 flex min-h-screen items-center justify-center">
        <span className="text-void-300">Loading...</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-void-900 flex min-h-screen items-center justify-center">
        <span className="text-void-300">Note not found</span>
      </div>
    );
  }

  const { note } = data;

  return (
    <div className="bg-void-900 min-h-screen">
      <header className="border-glass-border bg-void-800 flex h-12 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <LuDiamond className="text-accent-500" size={18} />
          <span className="font-heading text-void-50 text-sm font-bold">note.gae</span>
        </div>
        <span className="text-void-300 ml-auto text-xs">Public Note</span>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link
          to="/"
          className="text-void-300 hover:text-void-100 mb-6 inline-flex items-center gap-1 text-sm transition-colors"
        >
          <LuArrowLeft size={14} />
          Back to notes
        </Link>

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

        <p className="text-void-300 mb-8 text-xs">
          {new Date(note.updatedAt).toLocaleDateString()}
        </p>

        <div className="prose-void border-glass-border border-t pt-8">
          <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </div>

        <footer className="text-void-300 mt-12 text-center text-xs">© 2026 gae</footer>
      </main>
    </div>
  );
}
