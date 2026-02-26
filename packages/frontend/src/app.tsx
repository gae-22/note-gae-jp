import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    RouterProvider,
    createRouter,
    createRootRoute,
    createRoute,
} from '@tanstack/react-router';
import { LoginPage } from './components/features/auth/login-page';
import { DashboardPage } from './components/features/dashboard/dashboard-page';
import { EditorPage } from './components/features/editor/editor-page';
import { SharePage } from './components/features/share/share-page';
import { TokenExpiredPage } from './components/features/share/token-expired';
import { PublicNotesPage } from './components/features/public/public-notes-page';
import { PublicNoteDetailPage } from './components/features/public/public-note-detail-page';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            retry: 1,
        },
    },
});

// Route tree
const rootRoute = createRootRoute();

const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    component: LoginPage,
});

const dashboardRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/dashboard',
    component: DashboardPage,
});

const editorRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/notes/$noteId/edit',
    component: EditorPage,
});

const shareRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/s/$token',
    component: SharePage,
});

const expiredRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/s/expired',
    component: TokenExpiredPage,
});

const publicIndexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: PublicNotesPage,
});

const publicNoteRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/notes/$noteId',
    component: PublicNoteDetailPage,
});

const routeTree = rootRoute.addChildren([
    loginRoute,
    dashboardRoute,
    editorRoute,
    shareRoute,
    expiredRoute,
    publicIndexRoute,
    publicNoteRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}

export function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
        </QueryClientProvider>
    );
}
