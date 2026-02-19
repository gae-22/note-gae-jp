// @ts-ignore - BubbleMenu import type error
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import { Markdown } from 'tiptap-markdown';
import { useEffect } from 'react';

interface NoteEditorProps {
    content: string;
    onChange: (content: string) => void;
    editable?: boolean;
    onUploadImage?: (file: File) => Promise<string | null>;
}

export function NoteEditor({
    content,
    onChange,
    editable = true,
    onUploadImage,
}: NoteEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Image,
            Link.configure({
                openOnClick: false,
            }),
            Placeholder.configure({
                placeholder: 'Type "/" for commands...',
            }),
            BubbleMenuExtension,
            Markdown.configure({
                transformPastedText: true,
                transformCopiedText: true,
            }),
        ],
        content: content,
        editable: editable,
        onUpdate: ({ editor }) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const markdown = (editor.storage as any).markdown.getMarkdown();
            onChange(markdown);
        },
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[500px] p-4',
            },
            handleDrop: (view, event, _slice, moved) => {
                if (moved || !onUploadImage) return false;

                const hasFiles = event.dataTransfer?.files?.length;
                if (!hasFiles) return false;

                const images = Array.from(event.dataTransfer.files).filter(
                    (file) => file.type.startsWith('image/'),
                );

                if (images.length === 0) return false;

                event.preventDefault();

                images.forEach(async (image) => {
                    const url = await onUploadImage(image);
                    if (url) {
                        const { schema } = view.state;
                        const coordinates = view.posAtCoords({
                            left: event.clientX,
                            top: event.clientY,
                        });
                        if (!coordinates) return;

                        const node = schema.nodes.image.create({ src: url });
                        const transaction = view.state.tr.insert(
                            coordinates.pos,
                            node,
                        );
                        view.dispatch(transaction);
                    }
                });

                return true;
            },
            handlePaste: (view, event) => {
                if (!onUploadImage) return false;

                const hasFiles = event.clipboardData?.files?.length;
                if (!hasFiles) return false;

                const images = Array.from(event.clipboardData.files).filter(
                    (file) => file.type.startsWith('image/'),
                );

                if (images.length === 0) return false;

                event.preventDefault();

                images.forEach(async (image) => {
                    const url = await onUploadImage(image);
                    if (url) {
                        const { schema } = view.state;
                        const node = schema.nodes.image.create({ src: url });
                        const transaction =
                            view.state.tr.replaceSelectionWith(node);
                        view.dispatch(transaction);
                    }
                });

                return true;
            },
        },
    });

    // Better effect for handling prop changes (e.g. loading a new note)
    useEffect(() => {
        if (editor && content) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const currentMarkdown = (
                editor.storage as any
            ).markdown.getMarkdown();
            if (currentMarkdown !== content) {
                // Should potentially update content here if necessary, but relying on key prop for now
            }
        }
    }, [content, editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className='relative border rounded-md min-h-[500px]'>
            {/* BubbleMenu removed due to build error */}
            <EditorContent editor={editor} />
        </div>
    );
}
