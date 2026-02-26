import { EditorView } from '@codemirror/view';

export const voidKineticTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: 'var(--color-void-950)',
      color: 'var(--color-void-50)',
      fontSize: 'var(--text-sm)',
      fontFamily: 'var(--font-mono)',
    },
    '.cm-content': {
      caretColor: 'var(--color-accent-500)',
      lineHeight: '1.7',
      padding: '1rem 0',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: 'var(--color-accent-500)',
      borderLeftWidth: '2px',
    },
    '.cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'var(--color-accent-glow) !important',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(34, 34, 34, 0.5)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(34, 34, 34, 0.5)',
    },
    '.cm-gutters': {
      backgroundColor: 'var(--color-void-950)',
      color: 'var(--color-void-300)',
      border: 'none',
      width: '48px',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      textAlign: 'right',
      paddingRight: '12px',
      fontSize: 'var(--text-xs)',
    },
    '.cm-foldGutter': {
      width: '16px',
    },
    '&.cm-focused': {
      outline: 'none',
    },
    '.cm-scroller': {
      overflow: 'auto',
    },
    // Markdown syntax highlighting
    '.cm-header-1': {
      fontSize: '1.5em',
      fontWeight: '700',
      color: 'var(--color-accent-500)',
    },
    '.cm-header-2': {
      fontSize: '1.3em',
      fontWeight: '600',
      color: 'var(--color-accent-400)',
    },
    '.cm-header-3': {
      fontSize: '1.15em',
      fontWeight: '600',
      color: 'var(--color-accent-300)',
    },
    '.cm-strong': {
      fontWeight: '700',
      color: 'var(--color-void-50)',
    },
    '.cm-emphasis': {
      fontStyle: 'italic',
      color: 'var(--color-void-100)',
    },
    '.cm-strikethrough': {
      textDecoration: 'line-through',
      color: 'var(--color-void-300)',
    },
    '.cm-url': {
      color: 'var(--color-accent-500)',
      textDecoration: 'underline',
    },
    '.cm-link': {
      color: 'var(--color-accent-500)',
    },
    '.cm-monospace': {
      fontFamily: 'var(--font-mono)',
      backgroundColor: 'var(--color-void-700)',
      padding: '2px 4px',
      borderRadius: '3px',
    },
    '.cm-quote': {
      borderLeft: '3px solid var(--color-accent-500)',
      paddingLeft: '12px',
      color: 'var(--color-void-200)',
      fontStyle: 'italic',
    },
  },
  { dark: true },
);
