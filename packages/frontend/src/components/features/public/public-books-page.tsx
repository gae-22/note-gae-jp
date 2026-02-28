import { useNavigate, Link } from '@tanstack/react-router';
import { useBooks } from '@/hooks/use-books';
import { useTheme } from '@/hooks/use-theme';
import { LuBook, LuMoon, LuSun, LuBookOpen } from 'react-icons/lu';

export function PublicBooksPage() {
  const { data, isLoading } = useBooks();
  const navigate = useNavigate();
  const { toggleTheme, isDark } = useTheme();

  const books = data?.books?.filter((b) => b.isPublic) ?? [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-body text-zinc-900 dark:text-zinc-50 transition-colors duration-300">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-30 w-full border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-2xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
            <span className="font-heading font-bold text-lg tracking-tight">note.gae</span>
          </Link>
          <div className="flex gap-4 sm:gap-6 border-l border-zinc-200 dark:border-zinc-800 pl-6 h-6 items-center">
            <Link to="/" className="text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Articles</Link>
            <Link to="/books" className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 transition-colors">Books</Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 rounded-lg p-2 transition-colors">
            {isDark ? <LuMoon size={18} /> : <LuSun size={18} />}
          </button>
          <button onClick={() => navigate({ to: '/login' })} className="ml-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors hidden sm:block">
            Sign In
          </button>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-12 text-center">
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">Books</h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
            Deep dives and structured learning guides on various topics.
          </p>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-50 rounded-2xl bg-zinc-200 dark:bg-zinc-800/50" />
            ))}
          </div>
        ) : books.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
            {books.map((book) => (
              <Link
                key={book.id}
                to={`/books/${book.slug}` as any}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 transition-all hover:shadow-lg hover:-translate-y-1 hover:border-indigo-200 dark:hover:border-indigo-500/30"
              >
                <div>
                  <div className="mb-4 inline-flex items-center justify-center p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                    <LuBookOpen size={24} />
                  </div>
                  <h2 className="font-heading text-xl font-bold mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                    {book.title}
                  </h2>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm line-clamp-3 mb-4">
                    {book.description || 'No description available for this book.'}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between text-xs text-zinc-400 font-mono">
                  <span>Updated {new Date(book.updatedAt).toLocaleDateString()}</span>
                  <span className="group-hover:text-indigo-500 transition-colors flex items-center gap-1">Read Book <span className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">→</span></span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              <LuBook size={32} className="text-zinc-400 dark:text-zinc-500" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2 font-heading">No Books Published Yet</h3>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              Check back later for deep dives and structured learning guides.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
