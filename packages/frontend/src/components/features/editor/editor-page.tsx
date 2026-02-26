import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import type { NoteListItem } from '@note-gae/shared';
import {
    LuDiamond,
    LuArrowLeft,
    LuCode,
    LuEye,
    LuColumns2,
    LuCheck,
    LuLoader2,
    LuCircleDot,
    LuSettings,
    LuMoreHorizontal,
} from 'react-icons/lu';

type ViewMode = 'editor' | 'preview' | 'split';

export function EditorPage() {
    const { noteId } = useParams({ from: '/notes/$noteId/edit' });
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('split');
    const [saveStatus, setSaveStatus] = useState<
        'saved' | 'saving' | 'unsaved'
    >('saved');
    const saveTimer = useRef<Timer | null>(null);
    const initialized = useRef(false);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate({ to: '/login' });
        }
    }, [authLoading, isAuthenticated, navigate]);

    const { data: noteData } = useQuery({
        queryKey: ['notes', noteId],
        queryFn: () => api.get<{ note: NoteListItem }>(`/notes/${noteId}`),
        enabled: isAuthenticated,
    });

    // Initialize editor content
    useEffect(() => {
        if (noteData?.note && !initialized.current) {
            setTitle(noteData.note.title);
            setContent(noteData.note.content);
            initialized.current = true;
        }
    }, [noteData]);

    const saveMutation = useMutation({
        mutationFn: (data: { title?: string; content?: string }) =>
            api.patch(`/notes/${noteId}`, data),
        onSuccess: () => {
            setSaveStatus('saved');
            queryClient.invalidateQueries({ queryKey: ['notes'] });
        },
        onError: () => setSaveStatus('unsaved'),
    });

    const debouncedSave = useCallback(
        (t: string, c: string) => {
            setSaveStatus('unsaved');
            if (saveTimer.current) clearTimeout(saveTimer.current);
            saveTimer.current = setTimeout(() => {
                setSaveStatus('saving');
                saveMutation.mutate({ title: t, content: c });
            }, 1000);
        },
        [saveMutation],
    );

    const handleTitleChange = (value: string) => {
        setTitle(value);
        debouncedSave(value, content);
    };

    const handleContentChange = (value: string) => {
        setContent(value);
        debouncedSave(title, value);
    };

    const handleSaveNow = () => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        setSaveStatus('saving');
        saveMutation.mutate({ title, content });
    };

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                handleSaveNow();
            }
            if ((e.metaKey || e.ctrlKey) && e.key === '1') {
                e.preventDefault();
                setViewMode('editor');
            }
            if ((e.metaKey || e.ctrlKey) && e.key === '2') {
                e.preventDefault();
                setViewMode('preview');
            }
            if ((e.metaKey || e.ctrlKey) && e.key === '3') {
                e.preventDefault();
                setViewMode('split');
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [title, content]);

    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const lineCount = content.split('\n').length;

    return (
        <div className='min-h-screen bg-void-900 flex flex-col'>
            {/* Toolbar */}
            <header className='h-12 bg-void-800 border-b border-[rgba(255,255,255,0.06)] flex items-center px-4 gap-3 shrink-0'>
                <div className='flex items-center gap-2'>
                    <LuDiamond className='text-accent-500' size={18} />
                    <span className='font-heading font-bold text-sm text-void-50'>
                        note.gae
                    </span>
                </div>

                <button
                    onClick={() => navigate({ to: '/dashboard' })}
                    className='flex items-center gap-1 text-sm text-void-200 hover:text-void-50 transition-colors'
                >
                    <LuArrowLeft size={14} />
                    Dashboard
                </button>

                <div className='flex-1' />

                {/* View mode buttons */}
                <div className='flex items-center bg-void-700 rounded-md p-0.5'>
                    <button
                        onClick={() => setViewMode('editor')}
                        className={`p-1.5 rounded ${viewMode === 'editor' ? 'bg-void-600 text-accent-500' : 'text-void-300 hover:text-void-100'} transition-colors`}
                        title='Editor (⌘1)'
                    >
                        <LuCode size={16} />
                    </button>
                    <button
                        onClick={() => setViewMode('preview')}
                        className={`p-1.5 rounded ${viewMode === 'preview' ? 'bg-void-600 text-accent-500' : 'text-void-300 hover:text-void-100'} transition-colors`}
                        title='Preview (⌘2)'
                    >
                        <LuEye size={16} />
                    </button>
                    <button
                        onClick={() => setViewMode('split')}
                        className={`p-1.5 rounded ${viewMode === 'split' ? 'bg-void-600 text-accent-500' : 'text-void-300 hover:text-void-100'} transition-colors`}
                        title='Split (⌘3)'
                    >
                        <LuColumns2 size={16} />
                    </button>
                </div>

                {/* Save status */}
                <div className='flex items-center gap-1.5 text-sm'>
                    {saveStatus === 'saved' && (
                        <>
                            <LuCheck size={14} className='text-success' />
                            <span className='text-success'>Saved</span>
                        </>
                    )}
                    {saveStatus === 'saving' && (
                        <>
                            <LuLoader2
                                size={14}
                                className='text-void-200 animate-spin'
                            />
                            <span className='text-void-200'>Saving...</span>
                        </>
                    )}
                    {saveStatus === 'unsaved' && (
                        <>
                            <LuCircleDot size={14} className='text-warning' />
                            <span className='text-warning'>Unsaved</span>
                        </>
                    )}
                </div>
            </header>

            {/* Title input */}
            <div className='bg-void-900 border-b border-[rgba(255,255,255,0.06)] px-6 py-3'>
                <input
                    type='text'
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder='Untitled'
                    className='w-full bg-transparent font-heading text-2xl font-bold text-void-50 placeholder:text-void-400 focus:outline-none'
                />
            </div>

            {/* Editor + Preview */}
            <div className='flex-1 flex overflow-hidden'>
                {(viewMode === 'editor' || viewMode === 'split') && (
                    <div
                        className={`${viewMode === 'split' ? 'w-1/2 border-r border-[rgba(255,255,255,0.06)]' : 'w-full'} flex flex-col`}
                    >
                        <textarea
                            value={content}
                            onChange={(e) =>
                                handleContentChange(e.target.value)
                            }
                            className='flex-1 w-full p-6 bg-void-950 text-void-50 font-mono text-sm leading-7 resize-none focus:outline-none placeholder:text-void-400'
                            placeholder='Start writing in Markdown...'
                            spellCheck={false}
                        />
                    </div>
                )}

                {(viewMode === 'preview' || viewMode === 'split') && (
                    <div
                        className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} overflow-auto p-6 bg-void-900`}
                    >
                        <div className='prose prose-invert max-w-none text-void-50'>
                            {/* Simple preview — will enhance with unified pipeline */}
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: simpleMarkdownToHtml(content),
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Status bar */}
            <footer className='h-6 bg-void-800 border-t border-[rgba(255,255,255,0.06)] flex items-center px-4 text-xs text-void-300 gap-4'>
                <span>Ln {lineCount}</span>
                <span>Words: {wordCount}</span>
                <span>Markdown</span>
                <span>UTF-8</span>
            </footer>
        </div>
    );
}

// Simple markdown preview (will be replaced with unified pipeline)
function simpleMarkdownToHtml(md: string): string {
    return md
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(
            /`(.+?)`/g,
            '<code style="background:var(--color-void-700);padding:2px 6px;border-radius:4px;">$1</code>',
        )
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/\n/g, '<br />');
}
