import { useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for auto-saving with debounce.
 * Spec: frontend-design.md §NoteEditor — auto-save on content change
 *
 * @param saveFn - The function to call when saving
 * @param delay - Debounce delay in milliseconds (default 1500ms)
 */
export function useAutoSave(saveFn: () => void, delay = 1500) {
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const saveFnRef = useRef(saveFn);

    // Keep the ref up to date with the latest save function
    useEffect(() => {
        saveFnRef.current = saveFn;
    }, [saveFn]);

    const trigger = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            saveFnRef.current();
        }, delay);
    }, [delay]);

    const cancel = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const flush = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
            saveFnRef.current();
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return { trigger, cancel, flush };
}
