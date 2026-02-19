import { createFileRoute, Link } from '@tanstack/react-router';
import { useNote, useUpdateNote } from '@/hooks/use-note';
import { useDeleteNote } from '@/hooks/use-notes';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useCallback, useEffect, useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
    Globe,
    Lock,
    Save,
    Share2,
    Loader2,
    ArrowLeft,
    Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const Route = createFileRoute('/notes/$noteId')({
    component: NoteEditor,
});

function NoteEditor() {
    const { noteId } = Route.useParams();
    const { data: note, isLoading, error } = useNote(noteId);
    const updateNote = useUpdateNote();
    const deleteNote = useDeleteNote();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [visibility, setVisibility] = useState<
        'private' | 'public' | 'shared'
    >('private');
    const [isDirty, setIsDirty] = useState(false);
    const [mode, setMode] = useState<'edit' | 'preview'>('edit');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Sync state with fetched data
    useEffect(() => {
        if (note) {
            setTitle(note.title);
            setContent(note.contentMarkdown || '');
            setVisibility(note.visibility);
        }
    }, [note]);

    const handleSave = useCallback(() => {
        if (!isDirty) return;
        updateNote.mutate(
            {
                id: noteId,
                data: {
                    title,
                    contentMarkdown: content,
                    visibility,
                },
            },
            {
                onSuccess: () => {
                    setIsDirty(false);
                    toast.success('Saved');
                },
            },
        );
    }, [noteId, title, content, visibility, isDirty, updateNote]);

    // Auto-save with 1.5s debounce
    const { trigger: triggerAutoSave, flush: flushAutoSave } = useAutoSave(
        handleSave,
        1500,
    );

    // Trigger auto-save when content changes
    useEffect(() => {
        if (isDirty) {
            triggerAutoSave();
        }
    }, [isDirty, title, content, triggerAutoSave]);

    // Flush auto-save on unmount (navigate away)
    useEffect(() => {
        return () => {
            flushAutoSave();
        };
    }, [flushAutoSave]);

    // Keyboard shortcut: Ctrl/Cmd+S to save
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleSave]);

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this note?')) {
            deleteNote.mutate(noteId);
        }
    };

    const handleFileUpload = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            const imageUrl = data.data.url;
            const markdownImage = `![${file.name}](${imageUrl})`;

            const textarea = textareaRef.current;
            if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const newContent =
                    content.substring(0, start) +
                    markdownImage +
                    content.substring(end);
                setContent(newContent);
                setIsDirty(true);
            } else {
                setContent((prev) => prev + '\n' + markdownImage);
                setIsDirty(true);
            }
            toast.success('File uploaded');
        } catch {
            toast.error('Failed to upload file');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    if (isLoading) {
        return (
            <div className='flex items-center justify-center h-full'>
                <Loader2 className='h-8 w-8 animate-spin text-stone-500' />
            </div>
        );
    }

    if (error || !note) {
        return (
            <div className='flex flex-col items-center justify-center h-full space-y-4'>
                <p className='text-red-500'>Failed to load note.</p>
                <Link to='/'>
                    <Button variant='outline'>
                        <ArrowLeft className='mr-2 h-4 w-4' /> Back to Notes
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className='flex flex-col h-[calc(100vh-4rem)] space-y-4 max-w-4xl mx-auto'>
            {/* Header */}
            <div className='flex items-center justify-between gap-4'>
                <div className='flex items-center gap-2 flex-1'>
                    <Link to='/'>
                        <Button variant='ghost' size='icon'>
                            <ArrowLeft className='h-4 w-4' />
                        </Button>
                    </Link>
                    <Input
                        value={title}
                        onChange={(e) => {
                            setTitle(e.target.value);
                            setIsDirty(true);
                        }}
                        className='text-2xl font-bold border-none shadow-none focus-visible:ring-0 px-0 h-auto'
                        placeholder='Untitled Note'
                    />
                </div>
                <div className='flex items-center gap-2'>
                    <Select
                        value={visibility}
                        onValueChange={(
                            val: 'private' | 'public' | 'shared',
                        ) => {
                            setVisibility(val);
                            setIsDirty(true);
                        }}
                    >
                        <SelectTrigger className='w-[130px]'>
                            <SelectValue placeholder='Visibility' />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='private'>
                                <div className='flex items-center'>
                                    <Lock className='mr-2 h-3.5 w-3.5' />{' '}
                                    Private
                                </div>
                            </SelectItem>
                            <SelectItem value='public'>
                                <div className='flex items-center'>
                                    <Globe className='mr-2 h-3.5 w-3.5' />{' '}
                                    Public
                                </div>
                            </SelectItem>
                            <SelectItem value='shared'>
                                <div className='flex items-center'>
                                    <Share2 className='mr-2 h-3.5 w-3.5' />{' '}
                                    Shared
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Edit/Preview toggle */}
                    <div className='flex items-center border rounded-md overflow-hidden'>
                        <button
                            onClick={() => setMode('edit')}
                            className={cn(
                                'px-3 py-2 text-sm font-medium transition-colors',
                                mode === 'edit'
                                    ? 'bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-50'
                                    : 'bg-transparent text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-50',
                            )}
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => setMode('preview')}
                            className={cn(
                                'px-3 py-2 text-sm font-medium transition-colors',
                                mode === 'preview'
                                    ? 'bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-50'
                                    : 'bg-transparent text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-50',
                            )}
                        >
                            Preview
                        </button>
                    </div>

                    {/* File upload */}
                    <input
                        type='file'
                        ref={fileInputRef}
                        className='hidden'
                        onChange={handleFileUpload}
                        accept='image/*'
                    />
                    <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || mode === 'preview'}
                        title='Upload Image'
                    >
                        {isUploading ? (
                            <Loader2 className='h-4 w-4 animate-spin' />
                        ) : (
                            <svg
                                xmlns='http://www.w3.org/2000/svg'
                                width='16'
                                height='16'
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                            >
                                <path d='m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48' />
                            </svg>
                        )}
                    </Button>

                    {/* Save button */}
                    <Button
                        onClick={handleSave}
                        disabled={!isDirty || updateNote.isPending}
                        variant={isDirty ? 'default' : 'outline'}
                    >
                        {updateNote.isPending ? (
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        ) : (
                            <Save className='mr-2 h-4 w-4' />
                        )}
                        Save
                    </Button>

                    {/* Delete button */}
                    <Button
                        onClick={handleDelete}
                        disabled={deleteNote.isPending}
                        variant='ghost'
                        size='icon'
                        className='text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950'
                        title='Delete Note'
                    >
                        {deleteNote.isPending ? (
                            <Loader2 className='h-4 w-4 animate-spin' />
                        ) : (
                            <Trash2 className='h-4 w-4' />
                        )}
                    </Button>
                </div>
            </div>

            {/* Editor / Preview */}
            <div className='flex-1 min-h-0 border rounded-md shadow-sm bg-white dark:bg-stone-900 overflow-hidden relative'>
                {mode === 'edit' ? (
                    <Textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(
                            e: React.ChangeEvent<HTMLTextAreaElement>,
                        ) => {
                            setContent(e.target.value);
                            setIsDirty(true);
                        }}
                        className='w-full h-full p-4 resize-none border-none focus-visible:ring-0 font-mono text-sm leading-relaxed'
                        placeholder='Start writing...'
                    />
                ) : (
                    <div className='w-full h-full p-6 overflow-auto prose dark:prose-invert max-w-none'>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {content}
                        </ReactMarkdown>
                    </div>
                )}
            </div>

            {/* Status bar */}
            <div className='flex items-center justify-between'>
                <p className='text-xs text-stone-400'>
                    {content.length} characters
                </p>
                <p className='text-xs text-stone-400'>
                    {isDirty ? '● Unsaved changes' : '✓ All changes saved'}
                </p>
            </div>
        </div>
    );
}
