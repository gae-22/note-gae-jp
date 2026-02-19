import { createFileRoute, Link } from '@tanstack/react-router';
import { useNote, useUpdateNote } from '@/features/notes/hooks/use-note';
import { useDeleteNote } from '@/features/notes/hooks/use-notes';
import { useUpload } from '@/features/editor/hooks/use-upload';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useCallback, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { NoteEditor } from '@/features/editor/components/NoteEditor';

export const Route = createFileRoute('/notes/$noteId')({
    component: NoteEditorPage,
});

function NoteEditorPage() {
    const { noteId } = Route.useParams();
    const { data: note, isLoading, error } = useNote(noteId);
    const updateNote = useUpdateNote();
    const deleteNote = useDeleteNote();
    const { upload } = useUpload(); // Implementation of useUpload hook

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [visibility, setVisibility] = useState<
        'private' | 'public' | 'shared'
    >('private');
    const [isDirty, setIsDirty] = useState(false);

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

            {/* Editor */}
            <div className='flex-1 min-h-0 bg-white dark:bg-stone-900 rounded-md shadow-sm overflow-hidden'>
                <NoteEditor
                    key={noteId}
                    content={content}
                    onChange={(newContent) => {
                        setContent(newContent);
                        setIsDirty(true);
                    }}
                    onUploadImage={upload}
                />
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
