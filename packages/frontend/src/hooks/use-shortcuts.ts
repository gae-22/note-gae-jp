import { useEffect, useCallback, useRef } from 'react';

interface UseGlobalShortcutsOptions {
  onSearch?: () => void; // ⌘K
  onToggleSidebar?: () => void; // ⌘B
  onNewNote?: () => void; // ⌘N
}

export function useGlobalShortcuts(opts: UseGlobalShortcutsOptions) {
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.key === 'k') {
        e.preventDefault();
        optsRef.current.onSearch?.();
      }

      if (meta && e.key === 'b') {
        e.preventDefault();
        optsRef.current.onToggleSidebar?.();
      }

      if (meta && e.key === 'n') {
        e.preventDefault();
        optsRef.current.onNewNote?.();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
