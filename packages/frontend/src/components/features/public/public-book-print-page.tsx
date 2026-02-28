import { useEffect, useState } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useBook } from '@/hooks/use-books';
import { renderMarkdown } from '@/lib/markdown';

function ChapterContent({ content, title, isFirst }: { content: string; title: string; isFirst: boolean }) {
  const [html, setHtml] = useState('');

  useEffect(() => {
    if (content) {
      renderMarkdown(content).then(setHtml);
    } else {
      setHtml('<p><em>No content available for this chapter.</em></p>');
    }
  }, [content]);

  return (
    <div className={`mt-8 print:mt-6 ${!isFirst ? 'page-break' : ''}`}>
      <h2 className="text-2xl print:text-xl font-bold font-heading mb-4 pb-2 border-b border-zinc-200">
        {title}
      </h2>
      <div
        className="prose-void bg-white text-black"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

export function PublicBookPrintPage() {
  const { slug } = useParams({ strict: false }) as { slug: string };
  const { data, isLoading, error } = useBook(slug);

  useEffect(() => {
    // Only trigger print after data has successfully loaded and wait a bit for markdown to render
    if (data && !isLoading && !error) {
      const timer = setTimeout(() => {
        window.print();
      }, 1500); // 1.5 seconds should be enough for markdown to render

      return () => clearTimeout(timer);
    }
  }, [data, isLoading, error]);

  if (isLoading) {
    return <div className="p-8 font-mono text-zinc-500">Preparing printing document...</div>;
  }

  if (error || !data || !data.book.isPublic) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Error preparing document</h1>
        <p>Return to <Link to={`/books/${slug}` as any} className="text-indigo-600 underline">book page</Link>.</p>
      </div>
    );
  }

  const { book, chapters } = data;

  return (
    <div className="bg-white min-h-screen p-8 text-black font-body max-w-4xl mx-auto">
      {/* Print notification overlay (hidden during actual print) */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-blue-50 text-blue-700 px-6 py-3 rounded-full shadow-md font-medium text-sm no-print z-50 flex items-center gap-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        Preparing PDF... Please wait for the print dialog.
      </div>

      <div className="mb-4 text-sm text-zinc-500 no-print">
        <Link to={`/books/${book.slug}` as any} className="hover:underline">← Cancel and return to book</Link>
      </div>

      {/* Book Title Page */}
      <div className="py-12 print:py-8 text-center">
        <h1 className="font-heading text-4xl print:text-3xl font-extrabold tracking-tight mb-4">
          {book.title}
        </h1>
        {book.description && (
          <p className="text-lg print:text-base text-zinc-600 max-w-2xl mx-auto">
            {book.description}
          </p>
        )}
        <div className="mt-12 print:mt-8 text-zinc-400 font-mono text-sm print:text-xs">
          Generated from note.gae | {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Chapters */}
      <div className="mt-8 text-black">
        {chapters.length === 0 ? (
          <p className="text-center italic text-zinc-500 mt-12">This book has no chapters.</p>
        ) : (
          chapters.map((chapter: any, index: number) => (
            <ChapterContent
              key={chapter.id}
              title={`${index + 1}. ${chapter.title || 'Untitled Chapter'}`}
              content={chapter.note?.content || ''}
              isFirst={index === 0}
            />
          ))
        )}
      </div>
    </div>
  );
}
