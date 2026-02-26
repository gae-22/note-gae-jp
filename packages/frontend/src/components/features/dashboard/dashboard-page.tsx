import { useState, useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/hooks/use-auth';
import { useNotes, useCreateNote, useDeleteNote } from '@/hooks/use-notes';
import { useTags, useCreateTag, useDeleteTag } from '@/hooks/use-tags';
import { useTheme } from '@/hooks/use-theme';
import { useGlobalShortcuts } from '@/hooks/use-shortcuts';
import {
  LuDiamond,
  LuSearch,
  LuMoon,
  LuSun,
  LuPlus,
  LuFileText,
  LuTag,
  LuLogOut,
  LuExternalLink,
  LuPanelLeftClose,
  LuPanelLeftOpen,
  LuTrash2,
  LuGlobe,
  LuLock,
  LuX,
  LuMenu,
} from 'react-icons/lu';

export function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();
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

  const { data: notesData } = useNotes({
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

  if (authLoading) return <div className="bg-void-900 min-h-screen" />;

  const notes = notesData?.notes ?? [];
  const tags = tagsData?.tags ?? [];

  return (
    <div className="bg-void-900 flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-glass-border bg-void-800 flex h-14 shrink-0 items-center gap-4 border-b px-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-void-300 hover:text-void-100 transition-colors lg:hidden"
        >
          <LuMenu size={20} />
        </button>

        <div className="flex items-center gap-2">
          <LuDiamond className="text-accent-500" size={20} />
          <span className="font-heading text-void-50 font-bold tracking-tight">note.gae</span>
        </div>

        {/* Search */}
        <div className="relative mx-auto max-w-md flex-1">
          <LuSearch className="text-void-300 absolute top-1/2 left-3 -translate-y-1/2" size={16} />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search... (⌘K)"
            className="border-glass-border bg-void-700 text-void-50 placeholder:text-void-300 focus:border-accent-500 w-full rounded-lg border py-1.5 pr-4 pl-9 text-sm transition-colors focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="text-void-300 hover:bg-void-700 hover:text-void-100 rounded p-1.5 transition-colors"
            title={isDark ? 'Switch to Light' : 'Switch to Dark'}
          >
            {isDark ? <LuMoon size={16} /> : <LuSun size={16} />}
          </button>
          <a
            href="/"
            target="_blank"
            rel="noopener"
            className="text-void-300 hover:bg-void-700 hover:text-void-100 rounded p-1.5 transition-colors"
            title="View Public Notes"
          >
            <LuExternalLink size={16} />
          </a>
          <span className="text-void-200 text-xs">{user?.username}</span>
          <button
            onClick={() => logout()}
            className="text-void-300 hover:bg-void-700 hover:text-void-100 rounded p-1.5 transition-colors"
            aria-label="Logout"
          >
            <LuLogOut size={16} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="border-glass-border bg-void-800 flex w-60 shrink-0 animate-[fade-in_0.15s_var(--ease-out)] flex-col border-r">
            <div className="flex items-center justify-between p-3">
              <span className="text-void-200 text-xs font-medium tracking-wider uppercase">
                Notes
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-void-300 hover:text-void-100 hidden transition-colors lg:block"
                title="⌘B"
              >
                <LuPanelLeftClose size={16} />
              </button>
            </div>

            <div className="space-y-1 px-3">
              <button
                onClick={() => setSelectedTags([])}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                  selectedTags.length === 0
                    ? 'bg-void-700 text-void-50'
                    : 'text-void-200 hover:bg-void-700 hover:text-void-100'
                }`}
              >
                <LuFileText size={14} />
                <span>All</span>
                <span className="text-void-300 ml-auto text-xs">{notes.length}</span>
              </button>
            </div>

            <div className="mt-6 px-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-void-200 text-xs font-medium tracking-wider uppercase">Tags</p>
                <button
                  onClick={() => setShowNewTag(!showNewTag)}
                  className="text-void-300 hover:text-accent-500 transition-colors"
                >
                  <LuPlus size={12} />
                </button>
              </div>

              {showNewTag && (
                <div className="mb-2 flex gap-1">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                    placeholder="Tag name"
                    className="border-glass-border bg-void-600 text-void-50 placeholder:text-void-300 focus:border-accent-500 min-w-0 flex-1 rounded-md border px-2 py-1 text-xs focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleCreateTag}
                    className="bg-accent-500 text-void-900 rounded-md px-2 py-1 text-xs font-medium"
                  >
                    Add
                  </button>
                </div>
              )}

              <div className="space-y-0.5">
                {tags.map((tag) => (
                  <div key={tag.id} className="group flex items-center">
                    <button
                      onClick={() => toggleTag(tag.name)}
                      className={`flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                        selectedTags.includes(tag.name)
                          ? 'bg-void-600 text-void-50'
                          : 'text-void-200 hover:bg-void-700 hover:text-void-100'
                      }`}
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="truncate">{tag.name}</span>
                      <span className="text-void-300 ml-auto text-xs">{tag.noteCount}</span>
                    </button>
                    <button
                      onClick={() => deleteTag.mutate(tag.id)}
                      className="text-void-400 hover:text-error ml-1 rounded p-1 opacity-0 transition-all group-hover:opacity-100"
                      title="Delete tag"
                    >
                      <LuTrash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto p-3">
              <p className="text-void-300 text-center text-xs">© 2026 gae</p>
            </div>
          </aside>
        )}

        {!sidebarOpen && (
          <div className="border-glass-border bg-void-800 flex w-14 shrink-0 flex-col items-center border-r pt-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-void-300 hover:text-void-100 transition-colors"
              title="⌘B"
            >
              <LuPanelLeftOpen size={16} />
            </button>
          </div>
        )}

        {/* Main */}
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="font-heading text-void-50 text-2xl font-bold">Dashboard</h1>
            <button
              onClick={handleNewNote}
              disabled={createNote.isPending}
              className="bg-accent-500 text-void-900 hover:bg-accent-400 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors active:scale-[0.98]"
            >
              <LuPlus size={16} />
              New Note
            </button>
          </div>

          {/* Note Grid */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="group border-glass-border bg-void-700 hover:border-accent-500/30 relative rounded-xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <button
                  onClick={() =>
                    navigate({ to: '/notes/$noteId/edit', params: { noteId: note.id } })
                  }
                  className="w-full text-left"
                >
                  <div className="mb-2 flex items-start gap-2">
                    <LuFileText size={16} className="text-void-300 mt-0.5 shrink-0" />
                    <h3 className="font-heading text-void-50 group-hover:text-accent-400 line-clamp-2 text-lg font-semibold transition-colors">
                      {note.title || 'Untitled'}
                    </h3>
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
                  <div className="text-void-300 mt-3 flex items-center gap-2 text-xs">
                    {note.isPublic ? (
                      <LuGlobe size={12} className="text-accent-500" />
                    ) : (
                      <LuLock size={12} />
                    )}
                    <span>Updated {new Date(note.updatedAt).toLocaleDateString()}</span>
                    {note.commentCount > 0 && <span>· {note.commentCount} comments</span>}
                  </div>
                </button>
                {/* Delete button on hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this note?')) deleteNote.mutate(note.id);
                  }}
                  className="text-void-400 hover:bg-void-600 hover:text-error absolute top-2 right-2 rounded p-1 opacity-0 transition-all group-hover:opacity-100"
                  title="Delete"
                >
                  <LuTrash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {notes.length === 0 && (
            <div className="text-void-300 py-20 text-center">
              <LuFileText size={32} className="text-void-400 mx-auto mb-3" />
              <p className="mb-2">No notes yet.</p>
              <button
                onClick={handleNewNote}
                className="text-accent-500 hover:text-accent-400 inline-flex items-center gap-1 text-sm"
              >
                <LuPlus size={14} />
                Create your first note
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
