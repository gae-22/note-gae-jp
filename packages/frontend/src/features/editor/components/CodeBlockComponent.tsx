import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { cn } from '@/lib/utils';

export function CodeBlockComponent({
    node: {
        attrs: { language: defaultLanguage },
    },
}: NodeViewProps) {
    // Parse language and filename from the language string (e.g. "ts:index.ts")
    const rawLanguage = defaultLanguage || '';
    const [language, filename] = rawLanguage.includes(':')
        ? rawLanguage.split(':')
        : [rawLanguage, null];

    return (
        <NodeViewWrapper className='relative my-4 rounded-md border bg-stone-950 text-stone-50 overflow-hidden'>
            {/* Header (Filename) */}
            {filename && (
                <div className='flex items-center justify-between bg-stone-900 px-4 py-2 text-xs text-stone-400 border-b border-stone-800 font-mono'>
                    <span>{filename}</span>
                    <span className='uppercase text-[10px] opacity-70'>
                        {language}
                    </span>
                </div>
            )}

            {!filename && language && (
                <div className='absolute right-2 top-2 z-10 select-none text-xs text-stone-500 font-mono uppercase'>
                    {language}
                </div>
            )}

            <pre className={cn('p-4', !filename && 'pt-6')}>
                <NodeViewContent
                    className={language ? `language-${language}` : ''}
                />
            </pre>
        </NodeViewWrapper>
    );
}
