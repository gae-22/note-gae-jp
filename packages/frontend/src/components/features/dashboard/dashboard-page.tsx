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
            return api.get<{ notes: NoteListItem[]; pagination: unknown }>(
                `/notes?${params}`,
            );
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
            prev.includes(name)
                ? prev.filter((t) => t !== name)
                : [...prev, name],
        );
    };

    if (authLoading) return <div className='min-h-screen bg-void-900' />;

    const notes = notesData?.notes ?? [];
    const tags = tagsData?.tags ?? [];

    return (
        <div className='min-h-screen bg-void-900 flex flex-col'>
            {/* Header */}
            <header className='h-14 bg-void-800 border-b border-glass-border flex items-center px-4 gap-4 shrink-0'>
                <div className='flex items-center gap-2'>
                    <LuDiamond className='text-accent-500' size={20} />
                    <span className='font-heading font-bold text-void-50 tracking-tight'>
                        note.gae
                    </span>
                </div>

                {/* Search */}
                <div className='flex-1 max-w-md mx-auto relative'>
                    <LuSearch
                        className='absolute left-3 top-1/2 -translate-y-1/2 text-void-300'
                        size={16}
                    />
                    <input
                        type='text'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder='Search...'
                        className='w-full pl-9 pr-4 py-1.5 bg-void-700 border border-glass-border rounded-lg text-sm text-void-50 placeholder:text-void-300 focus:outline-none focus:border-accent-500 transition-colors'
                    />
                </div>

                <div className='flex items-center gap-2'>
                    <span className='text-xs text-void-200'>
                        {user?.username}
                    </span>
                    <button
                        onClick={() => logout()}
                        className='text-void-300 hover:text-void-100 transition-colors'
                        aria-label='Logout'
                    >
                        <LuLogOut size={16} />
                    </button>
                </div>
            </header>

            <div className='flex flex-1 overflow-hidden'>
                {/* Sidebar */}
                <aside
                    className={`${sidebarOpen ? 'w-60' : 'w-14'} bg-void-800 border-r border-glass-border flex flex-col shrink-0 transition-all duration-300`}
                >
                    <div className='p-3 flex items-center justify-between'>
                        {sidebarOpen && (
                            <span className='text-xs font-medium text-void-200 uppercase tracking-wider'>
                                Notes
                            </span>
                        )}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className='text-void-300 hover:text-void-100 transition-colors ml-auto'
                            aria-label='Toggle sidebar'
                        >
                            {sidebarOpen ? (
                                <LuPanelLeftClose size={16} />
                            ) : (
                                <LuPanelLeftOpen size={16} />
                            )}
                        </button>
                    </div>

                    {sidebarOpen && (
                        <>
                            <div className='px-3 space-y-1'>
                                <div className='flex items-center gap-2 px-2 py-1.5 rounded-md bg-void-700 text-void-50 text-sm'>
                                    <LuFileText size={14} />
                                    <span>All</span>
                                    <span className='ml-auto text-xs text-void-300'>
                                        {notes.length}
                                    </span>
                                </div>
                            </div>

                            <div className='mt-6 px-3'>
                                <p className='text-xs font-medium text-void-200 uppercase tracking-wider mb-2'>
                                    Tags
                                </p>
                                <div className='space-y-0.5'>
                                    {tags.map((tag) => (
                                        <button
                                            key={tag.id}
                                            onClick={() => toggleTag(tag.name)}
                                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                                                selectedTags.includes(tag.name)
                                                    ? 'bg-void-600 text-void-50'
                                                    : 'text-void-200 hover:text-void-100 hover:bg-void-700'
                                            }`}
                                        >
                                            <span
                                                className='w-2 h-2 rounded-full shrink-0'
                                                style={{
                                                    backgroundColor: tag.color,
                                                }}
                                            />
                                            <span className='truncate'>
                                                {tag.name}
                                            </span>
                                            <span className='ml-auto text-xs text-void-300'>
                                                {tag.noteCount}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </aside>

                {/* Main */}
                <main className='flex-1 overflow-auto p-6'>
                    <div className='flex items-center justify-between mb-6'>
                        <h1 className='font-heading text-2xl font-bold text-void-50'>
                            Dashboard
                        </h1>
                        <button
                            onClick={handleNewNote}
                            className='flex items-center gap-2 px-4 py-2 bg-accent-500 text-void-900 text-sm font-medium rounded-lg hover:bg-accent-400 transition-colors active:scale-[0.98]'
                        >
                            <LuPlus size={16} />
                            New Note
                        </button>
                    </div>

                    {/* Note Grid */}
                    <div className='grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4'>
                        {notes.map((note) => (
                            <button
                                key={note.id}
                                onClick={() =>
                                    navigate({
                                        to: '/notes/$noteId/edit',
                                        params: { noteId: note.id },
                                    })
                                }
                                className='text-left p-4 bg-void-700 border border-glass-border rounded-xl hover:border-accent-500/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group'
                            >
                                <div className='flex items-start gap-2 mb-2'>
                                    <LuFileText
                                        size={16}
                                        className='text-void-300 mt-0.5 shrink-0'
                                    />
                                    <h3 className='font-heading text-lg font-semibold text-void-50 line-clamp-2 group-hover:text-accent-400 transition-colors'>
                                        {note.title || 'Untitled'}
                                    </h3>
                                </div>
                                {note.tags.length > 0 && (
                                    <div className='flex gap-1.5 flex-wrap mt-2'>
                                        {note.tags.map((tag) => (
                                            <span
                                                key={tag.id}
                                                className='px-2 py-0.5 text-xs rounded-full bg-accent-glow text-accent-500'
                                            >
                                                {tag.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <p className='mt-3 text-xs text-void-300'>
                                    Updated{' '}
                                    {new Date(
                                        note.updatedAt,
                                    ).toLocaleDateString()}
                                </p>
                            </button>
                        ))}
                    </div>

                    {notes.length === 0 && (
                        <div className='text-center py-20 text-void-300'>
                            <LuFileText
                                size={32}
                                className='mx-auto mb-3 text-void-400'
                            />
                            <p>No notes yet. Create your first one!</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
