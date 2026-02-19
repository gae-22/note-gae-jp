import { Extension } from '@tiptap/react';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import {
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Image as ImageIcon,
    Code,
    Quote,
} from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

// Command Menu Items
const getSuggestionItems = ({ query }: { query: string }) => {
    return [
        {
            title: 'Heading 1',
            command: ({ editor, range }: any) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .setNode('heading', { level: 1 })
                    .run();
            },
            icon: Heading1,
        },
        {
            title: 'Heading 2',
            command: ({ editor, range }: any) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .setNode('heading', { level: 2 })
                    .run();
            },
            icon: Heading2,
        },
        {
            title: 'Heading 3',
            command: ({ editor, range }: any) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .setNode('heading', { level: 3 })
                    .run();
            },
            icon: Heading3,
        },
        {
            title: 'Bullet List',
            command: ({ editor, range }: any) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .toggleBulletList()
                    .run();
            },
            icon: List,
        },
        {
            title: 'Ordered List',
            command: ({ editor, range }: any) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .toggleOrderedList()
                    .run();
            },
            icon: ListOrdered,
        },
        {
            title: 'Code Block',
            command: ({ editor, range }: any) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .toggleCodeBlock()
                    .run();
            },
            icon: Code,
        },
        {
            title: 'Blockquote',
            command: ({ editor, range }: any) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .toggleBlockquote()
                    .run();
            },
            icon: Quote,
        },
        {
            title: 'Image',
            command: ({ editor, range }: any) => {
                // Trigger image upload logic or show dialog
                // For now, simple prompt or placeholder
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .setImage({ src: 'https://placehold.co/600x400' })
                    .run();
            },
            icon: ImageIcon,
        },
    ]
        .filter((item) =>
            item.title.toLowerCase().startsWith(query.toLowerCase()),
        )
        .slice(0, 10);
};

// React Component for the Menu
const CommandList = forwardRef((props: any, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            props.command(item);
        }
    };

    useEffect(() => {
        setSelectedIndex(0);
    }, [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === 'ArrowUp') {
                setSelectedIndex(
                    (selectedIndex + props.items.length - 1) %
                        props.items.length,
                );
                return true;
            }
            if (event.key === 'ArrowDown') {
                setSelectedIndex((selectedIndex + 1) % props.items.length);
                return true;
            }
            if (event.key === 'Enter') {
                selectItem(selectedIndex);
                return true;
            }
            return false;
        },
    }));

    return (
        <div className='z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2'>
            {props.items.length ? (
                props.items.map((item: any, index: number) => (
                    <button
                        className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none w-full text-left ${
                            index === selectedIndex
                                ? 'bg-accent text-accent-foreground'
                                : ''
                        }`}
                        key={index}
                        onClick={() => selectItem(index)}
                    >
                        <item.icon className='mr-2 h-4 w-4' />
                        <span>{item.title}</span>
                    </button>
                ))
            ) : (
                <div className='px-2 py-1.5 text-sm text-muted-foreground'>
                    No results
                </div>
            )}
        </div>
    );
});

CommandList.displayName = 'CommandList';

// Tiptap Extension
export const SlashCommands = Extension.create({
    name: 'slash-commands',

    addOptions() {
        return {
            suggestion: {
                char: '/',
                command: ({ editor, range, props }: any) => {
                    props.command({ editor, range });
                },
            },
        };
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ];
    },
});

export const renderSlashCommands = () => ({
    items: getSuggestionItems,
    render: () => {
        let component: any;
        let popup: any;

        return {
            onStart: (props: any) => {
                component = new ReactRenderer(CommandList, {
                    props,
                    editor: props.editor,
                });

                if (!props.clientRect) {
                    return;
                }

                popup = tippy('body', {
                    getReferenceClientRect: props.clientRect,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start',
                });
            },

            onUpdate(props: any) {
                component.updateProps(props);

                if (!props.clientRect) {
                    return;
                }

                popup[0].setProps({
                    getReferenceClientRect: props.clientRect,
                });
            },

            onKeyDown(props: any) {
                if (props.event.key === 'Escape') {
                    popup[0].hide();
                    return true;
                }

                return component.ref?.onKeyDown(props);
            },

            onExit() {
                popup[0].destroy();
                component.destroy();
            },
        };
    },
});
