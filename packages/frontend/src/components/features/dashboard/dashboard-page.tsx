import { useState, useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/hooks/use-auth';
import { useNotes, useCreateNote, useDeleteNote } from '@/hooks/use-notes';
import { useTags, useCreateTag, useDeleteTag } from '@/hooks/use-tags';
import { useTheme } from '@/hooks/use-theme';
import { useGlobalShortcuts } from '@/hooks/use-shortcuts';
import {
  LuSearch,
  LuMoon,
  LuSun,
  LuPlus,
  LuFileText,
  LuLogOut,
  LuExternalLink,
  LuPanelLeftClose,
  LuPanelLeftOpen,
  LuTrash2,
  LuGlobe,
  LuLock,
  LuMenu,
} from 'react-icons/lu';

export function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const { toggleTheme, isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [authLoading, isAuthenticated, navigate]);

  useGlobalShortcuts({
    onSearch: () => searchRef.current?.focus(),
    onToggleSidebar: () => setSidebarOpen((p) => !p),
    onNewNote: handleNewNote,
  });

  const { data: notesData, isLoading: notesLoading } = useNotes({
    q: search || undefined,
    tags: selectedTags.length ? selectedTags : undefined,
    enabled: isAuthenticated,
  });

  const { data: tagsData } = useTags(isAuthenticated);
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const createTag = useCreateTag();
  const deleteTag = useDeleteTag();

  async function handleNewNote() {
    const result = await createNote.mutateAsync({ title: '', content: '' });
    navigate({ to: '/notes/$noteId/edit', params: { noteId: result.note.id } });
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    await createTag.mutateAsync({ name: newTagName.trim() });
    setNewTagName('');
    setShowNewTag(false);
  };

  const toggleTag = (name: string) => {
    setSelectedTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name],
    );
  };

  if (authLoading) return <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen" />;

  const notes = notesData?.notes ?? [];
  const tags = tagsData?.tags ?? [];

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300 flex min-h-screen flex-col font-body text-zinc-900 dark:text-zinc-50 selection:bg-indigo-500/20 selection:text-indigo-700 dark:selection:text-indigo-300">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex h-14 shrink-0 items-center gap-4 px-4 shadow-sm z-20">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors lg:hidden p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <LuMenu size={20} />
        </button>

        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          <span className="font-heading font-bold text-lg tracking-tight">note.gae</span>
        </div>

        {/* Search */}
        <div className="relative mx-auto max-w-lg flex-1 pl-4 pr-4 hidden sm:block">
          <LuSearch className="text-zinc-400 absolute top-1/2 left-7 -translate-y-1/2" size={16} />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents... (⌘K)"
            className="border border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-indigo-500 w-full rounded-full py-1.5 pr-4 pl-10 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-1 sm:gap-2 ml-auto">
          <button
            onClick={toggleTheme}
            className="text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 rounded-md p-2 transition-colors"
            title={isDark ? 'Switch to Light' : 'Switch to Dark'}
          >
            {isDark ? <LuMoon size={18} /> : <LuSun size={18} />}
          </button>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 rounded-md p-2 transition-colors"
            title="View Public Notes"
          >
            <LuExternalLink size={18} />
          </a>
          <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-2 hidden sm:block" />
          <span className="text-zinc-600 dark:text-zinc-300 text-xs font-medium hidden sm:block">{user?.username}</span>
          <button
            onClick={() => logout()}
            className="text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-md p-2 transition-colors ml-1"
            aria-label="Logout"
          >
            <LuLogOut size={18} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-zinc-900/20 dark:bg-black/40 z-20 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`absolute lg:relative z-30 h-full border-r border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl flex w-64 shrink-0 flex-col transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:hidden'
          }`}
        >
          <div className="flex items-center justify-between p-4">
            <span className="text-zinc-500 dark:text-zinc-400 text-[10px] font-bold tracking-widest uppercase">
              Library
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors hidden lg:block p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title="Toggle Sidebar (⌘B)"
            >
              <LuPanelLeftClose size={16} />
            </button>
          </div>

          <div className="space-y-1 px-3">
            <button
              onClick={() => setSelectedTags([])}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                selectedTags.length === 0
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400'
                  : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <LuFileText size={16} />
              <span>All Notes</span>
              <span className="ml-auto text-xs bg-zinc-200/50 dark:bg-zinc-800/50 px-2 py-0.5 rounded-full">{notes.length}</span>
            </button>
          </div>

          <div className="mt-8 px-3">
            <div className="mb-3 px-1 flex items-center justify-between">
              <span className="text-zinc-500 dark:text-zinc-400 text-[10px] font-bold tracking-widest uppercase">Tags</span>
              <button
                onClick={() => setShowNewTag(!showNewTag)}
                className="text-zinc-400 hover:text-indigo-500 transition-colors p-1"
              >
                <LuPlus size={14} />
              </button>
            </div>

            {showNewTag && (
              <div className="mb-3 flex gap-2 px-1">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                  placeholder="New tag..."
                  className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:border-indigo-500 min-w-0 flex-1 rounded-md px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  autoFocus
                />
                <button
                  onClick={handleCreateTag}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-3 py-1 text-xs font-semibold transition-colors"
                >
                  Add
                </button>
              </div>
            )}

            <div className="space-y-0.5 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
              {tags.map((tag) => (
                <div key={tag.id} className="group flex items-center">
                  <button
                    onClick={() => toggleTag(tag.name)}
                    className={`flex flex-1 items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      selectedTags.includes(tag.name)
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-medium'
                        : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="truncate">{tag.name}</span>
                    <span className="ml-auto text-xs opacity-50">{tag.noteCount}</span>
                  </button>
                  <button
                    onClick={() => deleteTag.mutate(tag.id)}
                    className="text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 ml-1 rounded p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                    title="Delete tag"
                  >
                    <LuTrash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto p-4 border-t border-zinc-200 dark:border-zinc-800/50">
            <p className="text-zinc-400 dark:text-zinc-500 text-center text-[10px] font-mono uppercase tracking-widest">note.gae v1.0</p>
          </div>
        </aside>

        {!sidebarOpen && (
          <div className="border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 w-12 shrink-0 flex-col items-center pt-4 hidden lg:flex">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title="Toggle Sidebar (⌘B)"
            >
              <LuPanelLeftOpen size={18} />
            </button>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-zinc-50 dark:bg-zinc-950 p-6 md:p-10 lg:p-12 relative">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-heading text-zinc-900 dark:text-zinc-50 text-3xl font-bold tracking-tight mb-1">Documents</h1>
                <p className="text-zinc-500 text-sm">Manage your notes and ideas.</p>
              </div>
              <button
                onClick={handleNewNote}
                disabled={createNote.isPending}
                className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm border border-transparent hover:border-indigo-500/20 flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <LuPlus size={18} />
                New Document
              </button>
            </div>

            {/* Note Grid */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
              {notes.map((note, idx) => (
                <div
                  key={note.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 transition-all duration-300 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:-translate-y-1 animate-reveal"
                  style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
                >
                  <button
                    onClick={() =>
                      navigate({ to: '/notes/$noteId/edit', params: { noteId: note.id } })
                    }
                    className="w-full text-left flex-1 flex flex-col outline-none"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                       <h3 className="font-heading text-zinc-900 dark:text-zinc-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-2 text-lg font-bold transition-colors leading-snug">
                        {note.title || 'Untitled Document'}
                      </h3>
                    </div>

                    <p className="text-zinc-500 dark:text-zinc-400 text-sm line-clamp-2 mb-4 flex-1">
                      {/* Note excerpt would go here, falling back to empty space */}
                      No content preview available.
                    </p>

                    <div className="mt-auto">
                      {note.tags.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-1.5">
                          {note.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag.id}
                              className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded px-2 py-0.5 text-[10px] font-mono transition-colors"
                            >
                              #{tag.name}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-zinc-400 dark:text-zinc-500 text-xs border-t border-zinc-100 dark:border-zinc-800/60 pt-3">
                        <div className="flex items-center gap-2">
                          {note.isPublic ? (
                            <div className="flex items-center gap-1 text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                              <LuGlobe size={10} />
                              <span className="text-[10px] font-semibold tracking-wider font-mono">PUBLIC</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                              <LuLock size={10} />
                              <span className="text-[10px] font-semibold tracking-wider font-mono">PRIVATE</span>
                            </div>
                          )}
                        </div>
                        <span className="font-mono text-[10px]">
                          {new Date(note.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this document?')) deleteNote.mutate(note.id);
                    }}
                    className="absolute top-4 right-4 text-zinc-300 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400 p-2 rounded-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur outline-none opacity-0 group-hover:opacity-100 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                    title="Delete document"
                  >
                    <LuTrash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {notes.length === 0 && !notesLoading && (
              <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 py-24 text-center animate-reveal">
                <LuFileText size={48} className="text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-1">No documents found</h3>
                <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-sm mx-auto">Get started by creating a new markdown document to organize your thoughts.</p>
                <button
                  onClick={handleNewNote}
                  className="bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                >
                  <LuPlus size={16} />
                  New Document
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
