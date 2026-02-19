import { useState, useCallback } from 'react';

/**
 * URL state-like hook for note search query + pagination.
 * Spec: frontend-design.md §URL State — search/page synced in URL
 * Note: Full Nuqs implementation would sync to URL search params.
 * This implementation uses React state (can be upgraded to Nuqs later).
 */
export function useNoteSearch() {
    const [q, setQ] = useState<string>('');
    const [page, setPage] = useState<number>(1);

    const setQuery = useCallback((query: string) => {
        setQ(query);
        setPage(1); // reset to page 1 on new search
    }, []);

    const nextPage = useCallback(() => setPage((p) => p + 1), []);
    const prevPage = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);

    return {
        q,
        page,
        setQuery,
        setPage,
        nextPage,
        prevPage,
    };
}
