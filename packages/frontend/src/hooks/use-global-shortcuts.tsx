import { useEffect } from 'react';
import { toast } from 'sonner';

export function useGlobalShortcuts() {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // MacOS: metaKey, Windows/Linux: ctrlKey
            const isCtrlOrMeta = e.ctrlKey || e.metaKey;

            // Search: Ctrl+K / Cmd+K
            if (isCtrlOrMeta && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.focus();
                }
            }

            // Help: Ctrl+/ / Cmd+/
            if (isCtrlOrMeta && e.key === '/') {
                e.preventDefault();
                toast('Keyboard Shortcuts', {
                    description: (
                        <div className="grid gap-2 text-sm">
                            <div className="flex justify-between">
                                <span>Save Note</span>
                                <kbd className="bg-muted px-1.5 rounded">Cmd+S</kbd>
                            </div>
                            <div className="flex justify-between">
                                <span>Search</span>
                                <kbd className="bg-muted px-1.5 rounded">Cmd+K</kbd>
                            </div>
                            <div className="flex justify-between">
                                <span>Show Help</span>
                                <kbd className="bg-muted px-1.5 rounded">Cmd+/</kbd>
                            </div>
                        </div>
                    ),
                    duration: 5000,
                });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
}
