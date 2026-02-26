import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import type { NoteListItem, Tag } from '@note-gae/shared';
import {
  LuDiamond,
  LuSearch,
  LuMoon,
  LuPlus,
  LuFileText,
  LuPin,
  LuTag,
  LuLogOut,
  LuExternalLink,
  LuPanelLeftClose,
  LuPanelLeftOpen,
} from 'react-icons/lu';

export function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const { data: notesData } = useQuery({
    queryKey: ['notes', { q: search, tags: selectedTags }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (selectedTags.length) params.set('tags', selectedTags.join(','));
      return api.get<{ notes: NoteListItem[]; pagination: unknown }>(`/notes?${params}`);
    },
    enabled: isAuthenticated,
  });

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => api.get<{ tags: Tag[] }>('/tags'),
    enabled: isAuthenticated,
  });

  const handleNewNote = async () => {
    const { note } = await api.post<{ note: { id: string } }>('/notes', {
      title: '',
      content: '',
    });
    navigate({ to: '/notes/$noteId/edit', params: { noteId: note.id } });
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
      <header className="bg-void-800 border-glass-border flex h-14 shrink-0 items-center gap-4 border-b px-4">
        <div className="flex items-center gap-2">
          <LuDiamond className="text-accent-500" size={20} />
          <span className="font-heading text-void-50 font-bold tracking-tight">note.gae</span>
        </div>

        {/* Search */}
        <div className="relative mx-auto max-w-md flex-1">
          <LuSearch className="text-void-300 absolute top-1/2 left-3 -translate-y-1/2" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="bg-void-700 border-glass-border text-void-50 placeholder:text-void-300 focus:border-accent-500 w-full rounded-lg border py-1.5 pr-4 pl-9 text-sm transition-colors focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-void-200 text-xs">{user?.username}</span>
          <button
            onClick={() => logout()}
            className="text-void-300 hover:text-void-100 transition-colors"
            aria-label="Logout"
          >
            <LuLogOut size={16} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${sidebarOpen ? 'w-60' : 'w-14'} bg-void-800 border-glass-border flex shrink-0 flex-col border-r transition-all duration-300`}
        >
          <div className="flex items-center justify-between p-3">
            {sidebarOpen && (
              <span className="text-void-200 text-xs font-medium tracking-wider uppercase">
                Notes
              </span>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-void-300 hover:text-void-100 ml-auto transition-colors"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <LuPanelLeftClose size={16} /> : <LuPanelLeftOpen size={16} />}
            </button>
          </div>

          {sidebarOpen && (
            <>
              <div className="space-y-1 px-3">
                <div className="bg-void-700 text-void-50 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm">
                  <LuFileText size={14} />
                  <span>All</span>
                  <span className="text-void-300 ml-auto text-xs">{notes.length}</span>
                </div>
              </div>

              <div className="mt-6 px-3">
                <p className="text-void-200 mb-2 text-xs font-medium tracking-wider uppercase">
                  Tags
                </p>
                <div className="space-y-0.5">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.name)}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                        selectedTags.includes(tag.name)
                          ? 'bg-void-600 text-void-50'
                          : 'text-void-200 hover:text-void-100 hover:bg-void-700'
                      }`}
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{
                          backgroundColor: tag.color,
                        }}
                      />
                      <span className="truncate">{tag.name}</span>
                      <span className="text-void-300 ml-auto text-xs">{tag.noteCount}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="font-heading text-void-50 text-2xl font-bold">Dashboard</h1>
            <button
              onClick={handleNewNote}
              className="bg-accent-500 text-void-900 hover:bg-accent-400 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors active:scale-[0.98]"
            >
              <LuPlus size={16} />
              New Note
            </button>
          </div>

          {/* Note Grid */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {notes.map((note) => (
              <button
                key={note.id}
                onClick={() =>
                  navigate({
                    to: '/notes/$noteId/edit',
                    params: { noteId: note.id },
                  })
                }
                className="bg-void-700 border-glass-border hover:border-accent-500/30 group rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
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
                <p className="text-void-300 mt-3 text-xs">
                  Updated {new Date(note.updatedAt).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>

          {notes.length === 0 && (
            <div className="text-void-300 py-20 text-center">
              <LuFileText size={32} className="text-void-400 mx-auto mb-3" />
              <p>No notes yet. Create your first one!</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
