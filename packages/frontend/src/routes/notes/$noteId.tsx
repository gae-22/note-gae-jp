import { createFileRoute, Link } from '@tanstack/react-router';
import { useNote, useUpdateNote } from '@/hooks/use-note';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Globe, Lock, Save, Share2, Loader2, ArrowLeft } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export const Route = createFileRoute('/notes/$noteId')({
    component: NoteEditor,
});

function NoteEditor() {
    const { noteId } = Route.useParams();
    const { data: note, isLoading, error } = useNote(noteId);
    const updateNote = useUpdateNote();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [visibility, setVisibility] = useState<
        'private' | 'public' | 'shared'
    >('private');
    const [isDirty, setIsDirty] = useState(false);

    // Sync state with fetching data
    useEffect(() => {
        if (note) {
            setTitle(note.title);
            setContent(note.contentMarkdown || '');
            setVisibility(note.visibility);
        }
    }, [note]);

    const handleSave = () => {
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
                },
            },
        );
    };

    // Auto-save logic could go here (e.g. debounced effect)

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
            <div className='flex items-center justify-between gap-4'>
                <Input
                    value={title}
                    onChange={(e) => {
                        setTitle(e.target.value);
                        setIsDirty(true);
                    }}
                    className='text-2xl font-bold border-none shadow-none focus-visible:ring-0 px-0 h-auto'
                    placeholder='Untitled Note'
                />
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

                    <Button
                        onClick={handleSave}
                        disabled={!isDirty || updateNote.isPending}
                    >
                        {updateNote.isPending ? (
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        ) : (
                            <Save className='mr-2 h-4 w-4' />
                        )}
                        Save
                    </Button>
                </div>
            </div>

            <div className='flex-1 min-h-0 border rounded-md shadow-sm bg-white dark:bg-stone-900 overflow-hidden relative'>
                <Textarea
                    value={content}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                        setContent(e.target.value);
                        setIsDirty(true);
                    }}
                    className='w-full h-full p-4 resize-none border-none focus-visible:ring-0 font-mono text-sm leading-relaxed'
                    placeholder='Start writing...'
                />
            </div>
            <p className='text-xs text-stone-400 text-right'>
                {isDirty ? 'Unsaved changes' : 'All changes saved'}
            </p>
        </div>
    );
}
