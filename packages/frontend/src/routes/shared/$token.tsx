import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { rpc } from '@/lib/rpc';
import { Loader2, ArrowLeft, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

export const Route = createFileRoute('/shared/$token')({
    component: SharedNotePage,
});

function SharedNotePage() {
    const { token } = Route.useParams();

    const { data, isLoading, error } = useQuery({
        queryKey: ['shared-note', token],
        queryFn: async () => {
            const res = await rpc.share[':token'].$get({ param: { token } });
            if (!res.ok) throw new Error('Note not found');
            const json = await res.json();
            if (!json.success) throw new Error('Note not found');
            return (json as any).data;
        },
        retry: false,
    });

    if (isLoading) {
        return (
            <div className='flex items-center justify-center min-h-screen'>
                <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className='flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4'>
                <AlertCircle className='h-12 w-12 text-muted-foreground' />
                <h1 className='text-2xl font-bold'>ページが見つかりません</h1>
                <p className='text-muted-foreground'>
                    この共有リンクは無効または期限切れです。
                </p>
                <Link to='/'>
                    <Button variant='outline' className='gap-2'>
                        <ArrowLeft className='h-4 w-4' />
                        トップへ戻る
                    </Button>
                </Link>
            </div>
        );
    }

    const note = data.note;

    return (
        <div className='min-h-screen bg-background'>
            {/* Header */}
            <header className='border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-10'>
                <div className='max-w-4xl mx-auto px-4 py-3 flex items-center justify-between'>
                    <span className='text-sm text-muted-foreground font-medium'>
                        Shared Note
                    </span>
                    <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                        <Clock className='h-3.5 w-3.5' />
                        {note.shareExpiresAt ? (
                            <span>
                                Expires{' '}
                                {formatDistanceToNow(
                                    new Date(note.shareExpiresAt),
                                    { addSuffix: true },
                                )}
                            </span>
                        ) : (
                            <span>No expiry</span>
                        )}
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className='max-w-4xl mx-auto px-4 py-10'>
                {note.icon && <div className='text-5xl mb-4'>{note.icon}</div>}
                <h1 className='text-4xl font-bold tracking-tight mb-2'>
                    {note.title || 'Untitled'}
                </h1>
                <p className='text-sm text-muted-foreground mb-8'>
                    Updated{' '}
                    {formatDistanceToNow(new Date(note.updatedAt), {
                        addSuffix: true,
                    })}
                </p>

                <div className='prose prose-stone dark:prose-invert max-w-none'>
                    <pre className='whitespace-pre-wrap font-sans text-base leading-relaxed'>
                        {note.contentMarkdown || ''}
                    </pre>
                </div>
            </main>
        </div>
    );
}
