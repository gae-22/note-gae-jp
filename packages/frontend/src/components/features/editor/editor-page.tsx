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
    mutationFn: (data: { title?: string; content?: string; isPublic?: boolean; tagIds?: string[] }) =>
      api.patch(`/notes/${noteId}`, data),
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

  const handleTitleChange = (value: string) => { setTitle(value); debouncedSave(value, content); };
  const handleContentChange = (value: string) => { setContent(value); debouncedSave(title, value); };

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
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSaveNow(); }
      if ((e.metaKey || e.ctrlKey) && e.key === '1') { e.preventDefault(); setViewMode('editor'); }
      if ((e.metaKey || e.ctrlKey) && e.key === '2') { e.preventDefault(); setViewMode('preview'); }
      if ((e.metaKey || e.ctrlKey) && e.key === '3') { e.preventDefault(); setViewMode('split'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [title, content]);

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const lineCount = content.split('\n').length;
  const charCount = content.length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col font-body transition-colors duration-300">
      {/* ─── Toolbar ─── */}
      <header className="sticky top-0 z-30 w-full border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-2xl backdrop-saturate-150 shrink-0">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          {/* Left */}
          <div className="flex items-center gap-4 sm:gap-6">
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
                <><div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" /><span className="text-emerald-600 dark:text-emerald-400 hidden sm:inline">Saved</span></>
              )}
              {saveStatus === 'saving' && (
                <><LuLoader size={14} className="text-zinc-400 animate-spin" /><span className="text-zinc-500 dark:text-zinc-400 hidden sm:inline">Saving...</span></>
              )}
              {saveStatus === 'unsaved' && (
                <><div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]" /><span className="text-amber-600 dark:text-amber-400 hidden sm:inline">Unsaved</span></>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* View mode toggle */}
            <div className="flex items-center rounded-xl bg-zinc-100 dark:bg-zinc-800/60 p-1 border border-zinc-200/60 dark:border-zinc-700/50">
              {(['editor', 'preview', 'split'] as const).map((mode, i) => {
                const icons = [LuCode, LuEye, LuColumns2];
                const labels = ['Editor (⌘1)', 'Preview (⌘2)', 'Split (⌘3)'];
                const Icon = icons[i];
                return (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`rounded-lg p-2 transition-all duration-200 ${
                      viewMode === mode
                        ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-zinc-200/60 dark:border-zinc-600/60'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50'
                    }`}
                    title={labels[i]}
                  >
                    <Icon size={16} />
                  </button>
                );
              })}
            </div>

            <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />

            <div className="flex items-center gap-1">
              <button onClick={handleExportMd} className="text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 rounded-lg p-2 transition-colors" title="Export">
                <LuDownload size={18} />
              </button>
              <button onClick={() => { if (confirm('Delete this document?')) deleteMutation.mutate(); }} className="text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-lg p-2 transition-colors" title="Delete">
                <LuTrash2 size={18} />
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`rounded-lg p-2 transition-all duration-200 ${
                  showSettings
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/20'
                    : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50'
                }`}
                title="Settings"
              >
                <LuSettings size={18} />
              </button>
            </div>
          </div>
        </div>
        <div className="h-px bg-linear-to-r from-transparent via-indigo-500/20 to-transparent" />
      </header>

      {/* ─── Title Input ─── */}
      <div className="w-full border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 px-6 sm:px-8 py-5 shrink-0">
        <div className="mx-auto max-w-4xl">
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Document Title..."
            className="w-full bg-transparent font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:outline-none"
          />
        </div>
      </div>

      {/* ─── Editor / Preview ─── */}
      <div className="flex flex-1 overflow-hidden relative">
        {(viewMode === 'editor' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} flex flex-col bg-white dark:bg-zinc-950 relative`}>
            {viewMode === 'split' && (
              <div className="absolute top-0 right-0 bottom-0 w-px bg-linear-to-b from-transparent via-indigo-500/15 to-transparent z-10" />
            )}
            <EditorPane value={content} onChange={handleContentChange} />
          </div>
        )}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} bg-zinc-50 dark:bg-zinc-900/50 overflow-y-auto`}>
            <div className="mx-auto max-w-3xl p-8 sm:p-12">
              <PreviewPane content={content} />
            </div>
          </div>
        )}
      </div>

      {/* ─── Status Bar ─── */}
      <footer className="w-full border-t border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 flex h-8 shrink-0 items-center justify-between px-4 sm:px-6 text-xs font-mono transition-colors">
        <div className="flex items-center gap-4 sm:gap-6">
          <span>{lineCount} lines</span>
          <span className="hidden sm:inline">{wordCount} words</span>
          <span className="hidden sm:inline">{charCount} chars</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          {noteData?.note?.isPublic !== undefined && (
            <span className={`font-semibold flex items-center gap-1.5 ${noteData.note.isPublic ? 'text-indigo-500' : 'text-zinc-500'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${noteData.note.isPublic ? 'bg-indigo-500' : 'bg-zinc-400'}`} />
              {noteData.note.isPublic ? 'Public' : 'Private'}
            </span>
          )}
          <span className="hidden sm:inline text-zinc-400">Markdown</span>
        </div>
      </footer>

      {/* Settings Panel */}
      {showSettings && noteData?.note && (
        <NoteSettingsPanel
          noteId={noteId}
          isPublic={noteData.note.isPublic}
          noteTags={noteData.note.tags}
          onTogglePublic={(pub) => saveMutation.mutate({ isPublic: pub })}
          onUpdateTags={(tagIds) => saveMutation.mutate({ tagIds })}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
