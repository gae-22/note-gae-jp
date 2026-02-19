import { Link } from '@tanstack/react-router';
import { format } from 'date-fns';
import { Lock, Globe, Share2, FileText } from 'lucide-react';
import type { Note } from '../hooks/use-notes';

interface NoteCardProps {
    note: Note;
}

export function NoteCard({ note }: NoteCardProps) {
    // Determine icon based on visibility
    const VisibilityIcon = {
        private: Lock,
        public: Globe,
        shared: Share2,
    }[note.visibility];

    return (
        <Link
            to='/admin/notes/$noteId'
            params={{ noteId: note.id }}
            className='group relative flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:scale-[1.02] hover:shadow-md hover:-translate-y-1 active:scale-[0.98] active:translate-y-0'
        >
            {/* Cover Image Area */}
            <div className='relative h-32 w-full overflow-hidden bg-muted'>
                {note.coverImage ? (
                    <img
                        src={note.coverImage}
                        alt=''
                        className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
                    />
                ) : (
                    <div className='absolute inset-0 bg-linear-to-br from-muted/50 to-muted/10 opacity-50' />
                )}

                {/* Visibility Badge */}
                <div className='absolute right-2 top-2 rounded-full bg-background/80 p-1.5 backdrop-blur-sm'>
                    <VisibilityIcon className='h-3 w-3 text-muted-foreground' />
                </div>
            </div>

            {/* Content Area */}
            <div className='flex flex-1 flex-col p-4'>
                <div className='mb-2 flex items-start justify-between gap-2'>
                    <h3 className='line-clamp-2 font-semibold leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary'>
                        {note.icon && <span className='mr-2'>{note.icon}</span>}
                        {note.title || 'Untitled'}
                    </h3>
                </div>

                <div className='mt-auto flex items-center justify-between text-xs text-muted-foreground'>
                    <span className='flex items-center gap-1'>
                        <FileText className='h-3 w-3' />
                        {/* Placeholder for reading time or block count if available */}
                        DOC
                    </span>
                    <time dateTime={note.updatedAt}>
                        {format(new Date(note.updatedAt), 'MMM d, yyyy')}
                    </time>
                </div>
            </div>

            {/* Ambient Shadow/Glow effect on hover (optional enhancement via CSS or keeping simple Tailwind) */}
        </Link>
    );
}
