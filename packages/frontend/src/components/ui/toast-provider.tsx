import { Toaster } from 'sonner';

export function ToastProvider() {
    return (
        <Toaster
            position='bottom-right'
            toastOptions={{
                style: {
                    background: 'var(--toast-bg, #fff)',
                    border: '1px solid var(--toast-border, #e5e5e5)',
                    color: 'var(--toast-fg, #1c1917)',
                },
            }}
            richColors
            closeButton
        />
    );
}
