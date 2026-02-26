import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { EditorPane } from './editor-pane';
import { PreviewPane } from './preview-pane';
import { NoteSettingsPanel } from '../settings/note-settings-panel';
import type { NoteListItem } from '@note-gae/shared';
import {
  LuArrowLeft,
  LuCode,
  LuEye,
  LuColumns2,
  LuCheck,
  LuLoader,
  LuCircleDot,
  LuSettings,
  LuTrash2,
  LuDownload,
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
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [showSettings, setShowSettings] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  useEffect(() => {
    if (noteData?.note && !initialized.current) {
      setTitle(noteData.note.title);
      setContent(noteData.note.content);
      initialized.current = true;
    }
  }, [noteData]);

  const saveMutation = useMutation({
    mutationFn: (data: {
      title?: string;
      content?: string;
      isPublic?: boolean;
      tagIds?: string[];
    }) => api.patch(`/notes/${noteId}`, data),
    onSuccess: () => {
      setSaveStatus('saved');
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: () => setSaveStatus('unsaved'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/notes/${noteId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      navigate({ to: '/dashboard' });
    },
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

  const handleExportMd = () => {
    const blob = new Blob([`# ${title}\n\n${content}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'untitled'}.md`;
    a.click();
    URL.revokeObjectURL(url);
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
  const charCount = content.length;

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 flex min-h-screen flex-col font-body transition-colors duration-300">
      {/* Toolbar */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex h-14 shrink-0 items-center justify-between px-4 sm:px-6 shadow-sm z-10 transition-colors">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate({ to: '/dashboard' })}
            className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <LuArrowLeft size={16} />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800" />

          {/* Save status */}
          <div className="flex items-center gap-2 text-sm font-medium">
            {saveStatus === 'saved' && (
              <>
                <LuCheck size={16} className="text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Saved</span>
              </>
            )}
            {saveStatus === 'saving' && (
              <>
                <LuLoader size={16} className="text-zinc-400 animate-spin" />
                <span className="text-zinc-500 dark:text-zinc-400">Saving...</span>
              </>
            )}
            {saveStatus === 'unsaved' && (
              <>
                <LuCircleDot size={16} className="text-amber-500" />
                <span className="text-amber-600 dark:text-amber-400">Unsaved</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* View mode */}
          <div className="bg-zinc-100 dark:bg-zinc-800/50 flex items-center rounded-lg p-1 border border-zinc-200 dark:border-zinc-700/50">
            {(['editor', 'preview', 'split'] as const).map((mode, i) => {
              const icons = [LuCode, LuEye, LuColumns2];
              const labels = ['Editor (⌘1)', 'Preview (⌘2)', 'Split (⌘3)'];
              const Icon = icons[i];
              return (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`rounded-md p-2 transition-all ${
                    viewMode === mode
                      ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-xs ring-1 ring-zinc-200 dark:ring-zinc-600'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                  title={labels[i]}
                >
                  <Icon size={16} />
                </button>
              );
            })}
          </div>

          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />

          <div className="flex items-center gap-1.5 sm:flex">
            <button
              onClick={handleExportMd}
              className="text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 rounded-md p-2 transition-colors"
              title="Export Markdown"
            >
              <LuDownload size={18} />
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this document?')) deleteMutation.mutate();
              }}
              className="text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-md p-2 transition-colors"
              title="Delete Note"
            >
              <LuTrash2 size={18} />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`rounded-md p-2 transition-colors ${
                showSettings
                  ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50'
              }`}
              title="Settings"
            >
              <LuSettings size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Title */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 py-4 shadow-sm z-10 transition-colors">
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Document Title..."
          className="font-heading text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 w-full bg-transparent text-3xl sm:text-4xl font-bold focus:outline-none"
        />
      </div>

      {/* Editor + Preview */}
      <div className="flex flex-1 overflow-hidden relative">
        {(viewMode === 'editor' || viewMode === 'split') && (
          <div
            className={`${viewMode === 'split' ? 'border-r border-zinc-200 dark:border-zinc-800 w-1/2' : 'w-full'} flex flex-col bg-white dark:bg-zinc-950 transition-colors`}
          >
            <EditorPane value={content} onChange={handleContentChange} />
          </div>
        )}

        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} bg-zinc-50 dark:bg-zinc-900/50 transition-colors overflow-y-auto`}>
            <div className="max-w-4xl mx-auto p-8 sm:p-12">
              <PreviewPane content={content} />
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 flex h-8 shrink-0 items-center justify-between px-4 text-xs font-mono transition-colors">
        <div className="flex items-center gap-6">
          <span>{lineCount} lines</span>
          <span className="hidden sm:inline">{wordCount} words</span>
          <span className="hidden sm:inline">{charCount} chars</span>
        </div>
        <div className="flex items-center justify-end gap-6 text-right w-full sm:w-auto">
          {noteData?.note?.isPublic !== undefined && (
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {noteData.note.isPublic ? '🌐 Public Document' : '🔒 Private Document'}
            </span>
          )}
          <span className="hidden sm:inline">Markdown</span>
        </div>
      </footer>

      {/* Settings Panel */}
      {showSettings && noteData?.note && (
        <NoteSettingsPanel
          noteId={noteId}
          isPublic={noteData.note.isPublic}
          noteTags={noteData.note.tags}
          onTogglePublic={(pub) => {
            saveMutation.mutate({ isPublic: pub });
          }}
          onUpdateTags={(tagIds) => {
            saveMutation.mutate({ tagIds });
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
