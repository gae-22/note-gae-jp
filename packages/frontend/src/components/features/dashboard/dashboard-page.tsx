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

  if (authLoading) return <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950" />;

  const notes = notesData?.notes ?? [];
  const tags = tagsData?.tags ?? [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col font-body text-zinc-900 dark:text-zinc-50 transition-colors duration-300">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-30 w-full border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-2xl backdrop-saturate-150 shrink-0">
        <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors lg:hidden p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <LuMenu size={20} />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
            <span className="font-heading font-bold text-lg tracking-tight">note.gae</span>
          </div>

          {/* Search (centered) */}
          <div className="relative mx-auto max-w-md flex-1 hidden sm:block px-4">
            <LuSearch className="text-zinc-400 absolute top-1/2 left-7 -translate-y-1/2" size={15} />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents... (⌘K)"
              className="w-full rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/60 dark:bg-zinc-900/60 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-indigo-500/50 py-2 pr-4 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/15 backdrop-blur-sm transition-all"
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
            <button onClick={toggleTheme} className="text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 rounded-lg p-2 transition-colors" title={isDark ? 'Light' : 'Dark'}>
              {isDark ? <LuMoon size={18} /> : <LuSun size={18} />}
            </button>
            <a href="/" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 rounded-lg p-2 transition-colors" title="Public">
              <LuExternalLink size={18} />
            </a>
            <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block" />
            <span className="text-zinc-600 dark:text-zinc-300 text-xs font-medium hidden sm:block">{user?.username}</span>
            <button onClick={() => logout()} className="text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-lg p-2 transition-colors ml-1" aria-label="Logout">
              <LuLogOut size={18} />
            </button>
          </div>
        </div>
        <div className="h-px bg-linear-to-r from-transparent via-indigo-500/20 to-transparent" />
      </header>

      {/* ─── Body ─── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar overlay (mobile) */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-zinc-900/20 dark:bg-black/40 z-20 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside
          className={`absolute lg:relative z-30 h-full w-60 shrink-0 flex flex-col border-r border-zinc-200/60 dark:border-zinc-800/60 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl transition-transform duration-300 ease-spring ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:hidden'
          }`}
        >
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-zinc-400 dark:text-zinc-500 text-[10px] font-bold tracking-widest uppercase">Library</span>
            <button onClick={() => setSidebarOpen(false)} className="text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors hidden lg:block p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Toggle Sidebar (⌘B)">
              <LuPanelLeftClose size={16} />
            </button>
          </div>

          <div className="space-y-1 px-3">
            <button
              onClick={() => setSelectedTags([])}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                selectedTags.length === 0
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/20'
                  : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <LuFileText size={16} />
              <span>All Notes</span>
              <span className="ml-auto text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full font-mono">{notes.length}</span>
            </button>
          </div>

          <div className="mt-6 px-3">
            <div className="mb-3 px-1 flex items-center justify-between">
              <span className="text-zinc-400 dark:text-zinc-500 text-[10px] font-bold tracking-widest uppercase">Tags</span>
              <button onClick={() => setShowNewTag(!showNewTag)} className="text-zinc-400 hover:text-indigo-500 transition-colors p-1 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                <LuPlus size={14} />
              </button>
            </div>

            {showNewTag && (
              <div className="mb-3 flex gap-2 px-1">
                <input type="text" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()} placeholder="New tag..." className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:border-indigo-500 min-w-0 flex-1 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/30" autoFocus />
                <button onClick={handleCreateTag} className="rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-600 transition-colors">Add</button>
              </div>
            )}

            <div className="space-y-0.5 max-h-[40vh] overflow-y-auto pr-1">
              {tags.map((tag) => (
                <div key={tag.id} className="group flex items-center">
                  <button
                    onClick={() => toggleTag(tag.name)}
                    className={`flex flex-1 items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-all ${
                      selectedTags.includes(tag.name)
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium border border-indigo-200/50 dark:border-indigo-500/20'
                        : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full shadow-sm" style={{ backgroundColor: tag.color }} />
                    <span className="truncate">{tag.name}</span>
                    <span className="ml-auto text-xs opacity-50 font-mono">{tag.noteCount}</span>
                  </button>
                  <button onClick={() => deleteTag.mutate(tag.id)} className="text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 ml-1 rounded-lg p-1.5 opacity-0 transition-all group-hover:opacity-100" title="Delete">
                    <LuTrash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto p-4 border-t border-zinc-200/40 dark:border-zinc-800/40">
            <p className="text-zinc-400 dark:text-zinc-500 text-center text-[10px] font-mono uppercase tracking-widest">note.gae v1.0</p>
          </div>
        </aside>

        {/* Collapsed sidebar rail */}
        {!sidebarOpen && (
          <div className="hidden lg:flex w-12 shrink-0 flex-col items-center pt-4 border-r border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900">
            <button onClick={() => setSidebarOpen(true)} className="text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Toggle Sidebar (⌘B)">
              <LuPanelLeftOpen size={18} />
            </button>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6 sm:p-8 md:p-10 lg:p-12">
          <div className="mx-auto max-w-5xl">
            {/* Top bar */}
            <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight mb-1">Documents</h1>
                <p className="text-zinc-500 text-sm">Manage your notes and ideas.</p>
              </div>
              <button
                onClick={handleNewNote}
                disabled={createNote.isPending}
                className="flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_-2px_rgba(99,102,241,0.4)] hover:shadow-[0_6px_20px_-2px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 sm:w-auto w-full"
              >
                <LuPlus size={18} />
                New Document
              </button>
            </div>

            {/* Note Grid */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
              {notes.map((note, idx) => (
                <div
                  key={note.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 transition-all duration-300 hover:shadow-[0_8px_30px_-8px_rgba(99,102,241,0.12)] hover:border-indigo-200 dark:hover:border-indigo-500/25 hover:-translate-y-1 animate-reveal"
                  style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
                >
                  <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-indigo-500/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <button
                    onClick={() => navigate({ to: '/notes/$noteId/edit', params: { noteId: note.id } })}
                    className="relative w-full text-left flex-1 flex flex-col outline-none"
                  >
                    <h3 className="font-heading text-lg font-bold tracking-tight leading-snug line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 mb-3">
                      {note.title || 'Untitled Document'}
                    </h3>
                    <p className="text-zinc-400 text-sm line-clamp-2 mb-4 flex-1">No content preview available.</p>

                    <div className="mt-auto">
                      {note.tags.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-1.5">
                          {note.tags.slice(0, 4).map((tag) => (
                            <span key={tag.id} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-md px-2 py-0.5 text-[10px] font-mono">#{tag.name}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs border-t border-zinc-100 dark:border-zinc-800/60 pt-3">
                        {note.isPublic ? (
                          <span className="flex items-center gap-1 text-indigo-500 bg-indigo-500/8 border border-indigo-500/15 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono tracking-wider"><LuGlobe size={10} />PUBLIC</span>
                        ) : (
                          <span className="flex items-center gap-1 text-zinc-500 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/50 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono tracking-wider"><LuLock size={10} />PRIVATE</span>
                        )}
                        <span className="font-mono text-[10px] text-zinc-400">{new Date(note.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm('Delete this document?')) deleteNote.mutate(note.id); }}
                    className="absolute top-4 right-4 text-zinc-300 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400 p-2 rounded-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur outline-none opacity-0 group-hover:opacity-100 transition-all border border-zinc-200/50 dark:border-zinc-700/50 hover:border-red-200 dark:hover:border-red-900/30 shadow-sm"
                    title="Delete"
                  >
                    <LuTrash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            {/* Empty state */}
            {notes.length === 0 && !notesLoading && (
              <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 py-24 text-center animate-reveal">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  <LuFileText size={32} className="text-zinc-400 dark:text-zinc-500" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-1 font-heading">No documents found</h3>
                <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-sm mx-auto text-sm">Get started by creating a new markdown document.</p>
                <button onClick={handleNewNote} className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_-2px_rgba(99,102,241,0.4)] hover:shadow-[0_6px_20px_-2px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all">
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
