import { useNavigate, Link, useParams } from '@tanstack/react-router';
import { useBook } from '@/hooks/use-books';
import { useTheme } from '@/hooks/use-theme';
import { LuBookOpen, LuMoon, LuSun, LuArrowLeft, LuClock, LuFileText, LuDownload } from 'react-icons/lu';

export function PublicBookCoverPage() {
  const { slug } = useParams({ strict: false }) as { slug: string };
  const { data, isLoading, error } = useBook(slug);
  const navigate = useNavigate();
  const { toggleTheme, isDark } = useTheme();

  if (isLoading) {
     return <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center font-body text-zinc-500">Loading Book...</div>;
  }

  if (error || !data || !data.book.isPublic) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center font-body text-zinc-900 dark:text-zinc-50">
        <h1 className="text-2xl font-bold mb-4 font-heading">Book not found</h1>
        <Link to="/books" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">Return to Library</Link>
      </div>
    );
  }

  const { book, chapters } = data;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-body text-zinc-900 dark:text-zinc-50 transition-colors duration-300 flex flex-col">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-30 w-full border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-2xl px-4 sm:px-6 h-16 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
            <span className="font-heading font-bold text-lg tracking-tight">note.gae</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 rounded-lg p-2 transition-colors">
            {isDark ? <LuMoon size={18} /> : <LuSun size={18} />}
          </button>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-1 flex flex-col">
         {/* Hero Section */}
         <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200/60 dark:border-zinc-800/60">
           <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 text-center animate-fade-in">
             <Link to="/books" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-8 group">
               <LuArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Books
             </Link>

             <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-500/20">
               <LuBookOpen size={40} />
             </div>

             <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-3xl mx-auto leading-tight">
               {book.title}
             </h1>

             {book.description && (
               <p className="text-lg sm:text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                 {book.description}
               </p>
             )}

             <div className="flex items-center justify-center gap-6 text-sm text-zinc-500 font-mono">
                <span className="flex items-center gap-2"><LuFileText size={16} /> {chapters.length} Chapters</span>
                <span className="flex items-center gap-2"><LuClock size={16} /> Updated {new Date(book.updatedAt).toLocaleDateString()}</span>
             </div>

             {chapters.length > 0 && (
               <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                 <Link
                   to={`/books/${book.slug}/${chapters[0].id}` as any}
                   className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-indigo-600 px-8 py-4 text-base font-bold text-white shadow-[0_8px_20px_-4px_rgba(99,102,241,0.5)] hover:shadow-[0_12px_28px_-6px_rgba(99,102,241,0.6)] hover:-translate-y-1 active:translate-y-0 transition-all w-full sm:w-auto"
                 >
                   Start Reading
                 </Link>
                 <Link
                   to={`/books/${book.slug}/print` as any}
                   target="_blank"
                   className="inline-flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-zinc-800 px-6 py-4 text-base font-bold text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-sm hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400 hover:-translate-y-1 active:translate-y-0 transition-all w-full sm:w-auto"
                 >
                   <LuDownload size={18} />
                   本をPDF出力
                 </Link>
               </div>
             )}
           </div>
         </div>

         {/* Table of Contents */}
         <div className="bg-zinc-50 dark:bg-zinc-950 flex-1 py-16">
           <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
             <h2 className="font-heading text-2xl font-bold mb-8 flex items-center gap-3">
                <span className="h-8 w-2 rounded-full bg-indigo-500" />
                Table of Contents
             </h2>

             {chapters.length === 0 ? (
                <div className="text-zinc-500 bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 text-center text-sm">
                  This book has no chapters yet.
                </div>
             ) : (
                <div className="grid gap-4">
                  {chapters.map((chapter, index) => (
                    <Link
                      key={chapter.id}
                      to={`/books/${book.slug}/${chapter.id}` as any}
                      className="group flex items-center justify-between p-5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl hover:border-indigo-500/50 hover:shadow-md transition-all animate-reveal"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-5 min-w-0">
                         <div className="flex items-center justify-center h-10 w-10 shrink-0 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-mono font-bold group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-500/10 dark:group-hover:text-indigo-400 transition-colors">
                           {index + 1}
                         </div>
                         <h3 className="font-heading font-semibold text-lg truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                           {chapter.title || 'Untitled Chapter'}
                         </h3>
                      </div>
                      <span className="text-zinc-400 group-hover:text-indigo-500 transition-colors opacity-0 group-hover:opacity-100 sm:opacity-100">
                        Read →
                      </span>
                    </Link>
                  ))}
                </div>
             )}
           </div>
         </div>
      </main>
    </div>
  );
}
