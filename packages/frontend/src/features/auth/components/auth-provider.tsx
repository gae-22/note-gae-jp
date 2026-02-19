import { createContext, useContext, type ReactNode } from 'react';
import { useAuth } from '../hooks/use-auth';
import type { z } from 'zod';
import { userResponseSchema } from '@note-gae-jp/shared';

type User = z.infer<typeof userResponseSchema>;
import { Loader2 } from 'lucide-react';

interface AuthContextType {
    user: User | null | undefined;
    isLoading: boolean;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { user, isLoading, isAuthenticated } = useAuth();

    // Initial loading state (block render until we know auth state)
    // Optional: You can make this non-blocking if you prefer optimistic UI
    if (isLoading) {
        return (
            <div className='flex h-screen w-screen items-center justify-center bg-background'>
                <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
}
