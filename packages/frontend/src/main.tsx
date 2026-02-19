import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query';
import { ErrorBoundary } from './components/error-boundary';
import { ToastProvider } from './components/ui/toast-provider';
import './index.css';

// Import the generated route tree
import { routeTree } from './routeTree.gen';

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}

import { ThemeProvider } from './components/theme-provider';

// ... (imports)

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider defaultTheme='system' storageKey='vite-ui-theme'>
            <ErrorBoundary>
                <QueryClientProvider client={queryClient}>
                    <RouterProvider router={router} />
                    <ToastProvider />
                </QueryClientProvider>
            </ErrorBoundary>
        </ThemeProvider>
    </StrictMode>,
);
