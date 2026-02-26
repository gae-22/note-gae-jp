import { EditorView } from '@codemirror/view';

export const voidKineticTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: 'transparent',
      color: 'var(--color-text-primary, #18181b)',
      fontFamily: 'var(--font-mono, monospace)',
    },
    '.cm-content': {
      caretColor: 'var(--color-accent, #6366f1)',
      lineHeight: '1.8',
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: 'var(--color-accent, #6366f1)',
      borderLeftWidth: '2px',
    },
    '.cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'var(--color-selection, rgba(99, 102, 241, 0.2)) !important',
    },
    '.cm-activeLine': {
      backgroundColor: 'var(--color-bg-tertiary, rgba(244, 244, 245, 0.5))',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'transparent',
      color: 'var(--color-text-secondary, #71717a)',
    },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      color: 'var(--color-text-muted, #a1a1aa)',
      border: 'none',
      width: '48px',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      textAlign: 'right',
      paddingRight: '12px',
      fontSize: '0.75rem',
      paddingTop: '3px',
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
      fontSize: '1.75em',
      fontWeight: '800',
      color: 'var(--color-text-primary, #18181b)',
      fontFamily: 'var(--font-heading, sans-serif)',
    },
    '.cm-header-2': {
      fontSize: '1.5em',
      fontWeight: '700',
      color: 'var(--color-text-primary, #18181b)',
      fontFamily: 'var(--font-heading, sans-serif)',
    },
    '.cm-header-3': {
      fontSize: '1.25em',
      fontWeight: '600',
      color: 'var(--color-text-secondary, #3f3f46)',
      fontFamily: 'var(--font-heading, sans-serif)',
    },
    '.cm-strong': {
      fontWeight: '700',
      color: 'var(--color-text-primary, #18181b)',
    },
    '.cm-emphasis': {
      fontStyle: 'italic',
      color: 'var(--color-text-secondary, #3f3f46)',
    },
    '.cm-strikethrough': {
      textDecoration: 'line-through',
      color: 'var(--color-text-muted, #a1a1aa)',
    },
    '.cm-url': {
      color: 'var(--color-accent, #6366f1)',
      textDecoration: 'underline',
      opacity: '0.8',
    },
    '.cm-link': {
      color: 'var(--color-accent, #6366f1)',
      fontWeight: '500',
    },
    '.cm-monospace': {
      fontFamily: 'var(--font-mono, monospace)',
      backgroundColor: 'var(--color-bg-secondary, #f4f4f5)',
      padding: '0.125rem 0.25rem',
      borderRadius: '0.25rem',
      fontSize: '0.875em',
    },
    '.cm-quote': {
      borderLeft: '4px solid var(--color-accent, #6366f1)',
      paddingLeft: '1rem',
      color: 'var(--color-text-secondary, #3f3f46)',
      fontStyle: 'italic',
    },
  },
  { dark: false }, // Let the colors dynamically handle it via CSS vars
);
