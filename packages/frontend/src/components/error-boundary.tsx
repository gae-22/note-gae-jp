import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

/**
 * Error boundary for catching React rendering errors.
 * Spec: frontend-design.md §Error handling
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[ErrorBoundary]', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className='flex flex-col items-center justify-center min-h-[400px] space-y-4 p-8'>
                    <div className='text-center space-y-2'>
                        <h2 className='text-xl font-semibold text-stone-900 dark:text-stone-100'>
                            Something went wrong
                        </h2>
                        <p className='text-sm text-stone-500 dark:text-stone-400 max-w-md'>
                            An unexpected error occurred. Please try refreshing
                            the page.
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            this.setState({
                                hasError: false,
                                error: undefined,
                            });
                            window.location.reload();
                        }}
                        variant='outline'
                    >
                        Refresh Page
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
