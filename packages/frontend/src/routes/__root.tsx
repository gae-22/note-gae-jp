import {
    createRootRoute,
    Outlet,
    ScrollRestoration,
    Link,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { Button } from '@/components/ui/button';
import { AlertCircle, Home, RotateCcw, FileQuestion } from 'lucide-react';
import { AuthProvider } from '@/features/auth/components/auth-provider';

function NotFoundPage() {
    return (
        <div className='flex flex-col items-center justify-center min-h-screen gap-6 text-center px-4 bg-background'>
            <div className='relative'>
                <div className='absolute -inset-4 bg-primary/10 rounded-full blur-xl' />
                <FileQuestion className='relative h-16 w-16 text-muted-foreground' />
            </div>
            <div className='space-y-2'>
                <h1 className='text-4xl font-bold tracking-tight'>404</h1>
                <p className='text-xl font-semibold'>ページが見つかりません</p>
                <p className='text-muted-foreground max-w-sm'>
                    お探しのページは削除、移動、または存在しない可能性があります。
                </p>
            </div>
            <Link to='/'>
                <Button className='gap-2'>
                    <Home className='h-4 w-4' />
                    トップへ戻る
                </Button>
            </Link>
        </div>
    );
}

function ErrorPage({ error }: { error: Error }) {
    return (
        <div className='flex flex-col items-center justify-center min-h-screen gap-6 text-center px-4 bg-background'>
            <div className='relative'>
                <div className='absolute -inset-4 bg-destructive/10 rounded-full blur-xl' />
                <AlertCircle className='relative h-16 w-16 text-destructive' />
            </div>
            <div className='space-y-2'>
                <h1 className='text-4xl font-bold tracking-tight'>500</h1>
                <p className='text-xl font-semibold'>エラーが発生しました</p>
                <p className='text-muted-foreground max-w-sm'>
                    {error?.message || '予期せぬエラーが発生しました。'}
                </p>
            </div>
            <div className='flex gap-3'>
                <Button
                    variant='outline'
                    className='gap-2'
                    onClick={() => window.location.reload()}
                >
                    <RotateCcw className='h-4 w-4' />
                    再読み込み
                </Button>
                <Link to='/'>
                    <Button className='gap-2'>
                        <Home className='h-4 w-4' />
                        トップへ戻る
                    </Button>
                </Link>
            </div>
        </div>
    );
}

export const Route = createRootRoute({
    component: () => (
        <AuthProvider>
            <Outlet />
            <ScrollRestoration />
            {import.meta.env.DEV && (
                <TanStackRouterDevtools position='bottom-right' />
            )}
        </AuthProvider>
    ),
    notFoundComponent: () => <NotFoundPage />,
    errorComponent: ({ error }) => <ErrorPage error={error as Error} />,
});
