import { useParams, useNavigate, Link } from '@tanstack/react-router';
import { useBook } from '@/hooks/use-books';
import { useTheme } from '@/hooks/use-theme';
import { renderMarkdown } from '@/lib/markdown';
import { LuMenu, LuMoon, LuSun, LuChevronLeft, LuChevronRight, LuBook, LuArrowLeft } from 'react-icons/lu';
import { useState, useEffect } from 'react';

export function PublicBookChapterPage() {
  const { slug, chapterId } = useParams({ strict: false }) as { slug: string, chapterId: string };
  const { data, isLoading, error } = useBook(slug);
  const navigate = useNavigate();
  const { toggleTheme, isDark } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  // Close sidebar on desktop by default? Actually, desktop should be open, mobile closed.
  useEffect(() => {
    const isDesktop = window.innerWidth >= 1024;
    setSidebarOpen(isDesktop);
  }, []);

  const { book, chapters } = data || { book: null, chapters: [] };
  const currentChapterIndex = chapters?.findIndex((c: any) => c.id === chapterId) ?? -1;
  const currentChapter = currentChapterIndex >= 0 ? chapters[currentChapterIndex] : null;

  useEffect(() => {
    if (currentChapter?.note?.content) {
      renderMarkdown(currentChapter.note.content).then(setPreviewHtml);
    } else {
      setPreviewHtml('<p><em>No content available for this chapter.</em></p>');
    }
  }, [currentChapter?.note?.content]);

  if (isLoading) {
    return <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center font-body text-zinc-500">Loading Chapter...</div>;
  }

  if (error || !data || !book?.isPublic) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center font-body text-zinc-900 dark:text-zinc-50">
        <h1 className="text-2xl font-bold mb-4 font-heading">Not found</h1>
        <Link to={`/books/${slug}` as any} className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">Return to Book Details</Link>
      </div>
    );
  }

  if (!currentChapter) {
    return (
       <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center font-body text-zinc-900 dark:text-zinc-50">
         <h1 className="text-2xl font-bold mb-4 font-heading">Chapter not found</h1>
         <Link to={`/books/${slug}` as any} className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">Return to Table of Contents</Link>
       </div>
    );
  }

  const prevChapter = currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex < chapters.length - 1 ? chapters[currentChapterIndex + 1] : null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col font-body text-zinc-900 dark:text-zinc-50 transition-colors duration-300">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-2xl shrink-0">
        <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors lg:hidden p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <LuMenu size={20} />
          </button>

          <div className="flex items-center gap-2 max-w-xl pr-4">
             <Link to={`/books/${book.slug}` as any} className="hidden sm:flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors shrink-0">
               <LuArrowLeft size={16} /> <LuBook size={16} />
             </Link>
             <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 mx-1 hidden sm:block" />
             <h1 className="font-heading font-semibold text-sm truncate">{book.title}</h1>
          </div>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            <button onClick={toggleTheme} className="text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 rounded-lg p-2 transition-colors">
              {isDark ? <LuMoon size={18} /> : <LuSun size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* ─── Body ─── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar overlay (mobile) */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-zinc-900/20 dark:bg-black/40 z-20 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar TOC */}
        <aside
          className={`absolute lg:relative z-30 h-full w-72 shrink-0 flex flex-col border-r border-zinc-200/60 dark:border-zinc-800/60 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl transition-transform duration-300 ease-spring overflow-y-auto ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'
          }`}
        >
          <div className="p-5 border-b border-zinc-200/40 dark:border-zinc-800/40">
             <Link to={`/books/${book.slug}` as any} className="group flex flex-col gap-2">
               <span className="text-xs font-bold tracking-widest uppercase text-indigo-500 flex items-center gap-1.5"><LuBook size={12}/> BOOK</span>
               <h2 className="font-heading font-bold text-lg leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{book.title}</h2>
             </Link>
          </div>

          <nav className="p-3 space-y-0.5">
             <div className="px-3 py-2 text-xs font-bold tracking-widest uppercase text-zinc-400 dark:text-zinc-500 mt-2">Table of Contents</div>
             {chapters.map((chapter: any, index: number) => {
               const isActive = chapter.id === chapterId;
               return (
                 <Link
                   key={chapter.id}
                   to={`/books/${book.slug}/${chapter.id}` as any}
                   onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                   className={`flex gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                     isActive
                       ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-200/50 dark:border-indigo-500/20 shadow-sm'
                       : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200 border border-transparent'
                   }`}
                 >
                   <span className={`font-mono shrink-0 ${isActive ? 'text-indigo-500 opacity-100' : 'text-zinc-400 opacity-60'}`}>{index + 1}.</span>
                   <span className="leading-snug">{chapter.title || 'Untitled Chapter'}</span>
                 </Link>
               );
             })}
          </nav>
        </aside>

        {/* Main Chapter Content */}
        <main className="flex-1 overflow-auto">
          <article className="mx-auto max-w-3xl px-6 py-12 sm:px-8 md:py-16">
            <header className="mb-10 text-center animate-fade-in">
              <div className="mb-4 inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shadow-sm font-mono text-lg font-bold">
                {currentChapterIndex + 1}
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
                {currentChapter.title || 'Untitled Chapter'}
              </h1>
              <div className="h-1 w-20 bg-indigo-500 rounded-full mx-auto mb-8" />
            </header>

            <div
              className="prose-void animate-reveal rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-8 sm:p-10 md:p-12 relative overflow-hidden shadow-sm"
              style={{ animationDelay: '80ms' }}
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-indigo-500/30 to-transparent" />
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>

            {/* Pagination */}
            <nav className="mt-20 pt-8 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {prevChapter ? (
                <Link
                  to={`/books/${book.slug}/${prevChapter.id}` as any}
                  className="flex flex-col p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 hover:border-indigo-500/50 hover:bg-white dark:hover:bg-zinc-900 transition-all group items-start text-left"
                >
                  <span className="text-xs font-bold tracking-widest uppercase text-zinc-500 dark:text-zinc-400 mb-2 flex items-center gap-1.5"><LuChevronLeft size={16}/> PREVIOUS</span>
                  <span className="font-heading font-semibold text-lg line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{prevChapter.title || 'Untitled Chapter'}</span>
                </Link>
              ) : <div />}

              {nextChapter ? (
                <Link
                  to={`/books/${book.slug}/${nextChapter.id}` as any}
                  className="flex flex-col p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 hover:border-indigo-500/50 hover:bg-white dark:hover:bg-zinc-900 transition-all group items-end text-right"
                >
                  <span className="text-xs font-bold tracking-widest uppercase text-zinc-500 dark:text-zinc-400 mb-2 flex items-center gap-1.5">NEXT <LuChevronRight size={16}/></span>
                  <span className="font-heading font-semibold text-lg line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{nextChapter.title || 'Untitled Chapter'}</span>
                </Link>
              ) : (
                <Link
                  to={`/books/${book.slug}` as any}
                  className="flex flex-col p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 hover:border-indigo-500/50 hover:bg-white dark:hover:bg-zinc-900 transition-all group items-end text-right bg-indigo-50/50 dark:bg-indigo-500/5"
                >
                  <span className="text-xs font-bold tracking-widest uppercase text-indigo-500 mb-2 flex items-center gap-1.5"><LuBook size={16}/> FINISHED</span>
                  <span className="font-heading font-semibold text-lg line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Return to Table of Contents</span>
                </Link>
              )}
            </nav>
          </article>
        </main>
      </div>
    </div>
  );
}
