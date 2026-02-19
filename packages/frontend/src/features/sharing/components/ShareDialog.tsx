import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rpc } from '@/lib/rpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Check, Copy, Link2, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface ShareDialogProps {
    noteId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentShareToken?: string | null;
}

export function ShareDialog({
    noteId,
    open,
    onOpenChange,
    currentShareToken,
}: ShareDialogProps) {
    const queryClient = useQueryClient();
    const [duration, setDuration] = useState<string>('7d');
    const [copied, setCopied] = useState(false);

    const shareUrl = currentShareToken
        ? `${window.location.origin}/shared/${currentShareToken}`
        : null;

    const enableShare = useMutation({
        mutationFn: async () => {
            const res = await (rpc as any).notes[':id'].$patch({
                param: { id: noteId },
                json: { visibility: 'shared', shareDuration: duration },
            });
            if (!res.ok) throw new Error('Failed to enable sharing');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['note', noteId] });
            toast.success('Sharing link generated');
        },
        onError: () => toast.error('Failed to enable sharing'),
    });

    const disableShare = useMutation({
        mutationFn: async () => {
            const res = await (rpc as any).notes[':id'].$patch({
                param: { id: noteId },
                json: { visibility: 'private' },
            });
            if (!res.ok) throw new Error('Failed to disable sharing');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['note', noteId] });
            toast.success('Sharing disabled');
        },
        onError: () => toast.error('Failed to disable sharing'),
    });

    const handleCopy = async () => {
        if (!shareUrl) return;
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Link copied to clipboard');
    };

    if (!open) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className='fixed inset-0 bg-black/50 backdrop-blur-sm z-40'
                onClick={() => onOpenChange(false)}
            />

            {/* Modal */}
            <div className='fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-background border border-border rounded-xl shadow-2xl p-6'>
                {/* Header */}
                <div className='flex items-center justify-between mb-1'>
                    <h2 className='text-lg font-semibold flex items-center gap-2'>
                        <Link2 className='h-5 w-5' />
                        Share Note
                    </h2>
                    <button
                        onClick={() => onOpenChange(false)}
                        className='rounded-md hover:bg-muted p-1 transition-colors'
                    >
                        <X className='h-4 w-4' />
                    </button>
                </div>
                <p className='text-sm text-muted-foreground mb-4'>
                    Generate a shareable link for this note.
                </p>

                {/* Content */}
                <div className='space-y-4'>
                    {shareUrl ? (
                        <>
                            <div className='flex gap-2'>
                                <Input
                                    readOnly
                                    value={shareUrl}
                                    className='font-mono text-xs'
                                />
                                <Button
                                    size='icon'
                                    variant='outline'
                                    onClick={handleCopy}
                                    className='shrink-0'
                                >
                                    {copied ? (
                                        <Check className='h-4 w-4 text-green-500' />
                                    ) : (
                                        <Copy className='h-4 w-4' />
                                    )}
                                </Button>
                            </div>
                            <Button
                                variant='destructive'
                                className='w-full'
                                onClick={() => disableShare.mutate()}
                                disabled={disableShare.isPending}
                            >
                                {disableShare.isPending && (
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                )}
                                Disable Sharing
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className='space-y-2'>
                                <Label htmlFor='share-duration'>
                                    Link expiry
                                </Label>
                                <Select
                                    value={duration}
                                    onValueChange={setDuration}
                                >
                                    <SelectTrigger id='share-duration'>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value='1d'>
                                            1 day
                                        </SelectItem>
                                        <SelectItem value='7d'>
                                            7 days
                                        </SelectItem>
                                        <SelectItem value='30d'>
                                            30 days
                                        </SelectItem>
                                        <SelectItem value='unlimited'>
                                            No expiry
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                className='w-full gap-2'
                                onClick={() => enableShare.mutate()}
                                disabled={enableShare.isPending}
                            >
                                {enableShare.isPending ? (
                                    <Loader2 className='h-4 w-4 animate-spin' />
                                ) : (
                                    <Link2 className='h-4 w-4' />
                                )}
                                Generate Share Link
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
