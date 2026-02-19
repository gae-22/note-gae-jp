import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { rpc } from '@/lib/rpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export const Route = createFileRoute('/login')({
    component: Login,
});

function Login() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await rpc.auth.login.$post({
                json: { username, password },
            });

            if (res.ok) {
                await router.invalidate();
                await router.navigate({ to: '/' });
            } else {
                setError('Invalid credentials');
            }
        } catch (err) {
            setError('An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='flex items-center justify-center min-h-screen bg-stone-50 dark:bg-stone-900 px-4'>
            <Card className='w-full max-w-sm'>
                <CardHeader>
                    <CardTitle className='text-2xl'>Login</CardTitle>
                    <CardDescription>
                        Enter your credentials to access your notes.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className='space-y-4'>
                        <div className='space-y-2'>
                            <Label htmlFor='username'>Username</Label>
                            <Input
                                id='username'
                                type='text'
                                placeholder='admin'
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor='password'>Password</Label>
                            <Input
                                id='password'
                                type='password'
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        {error && (
                            <p className='text-sm text-red-500 font-medium'>
                                {error}
                            </p>
                        )}
                        <Button
                            className='w-full'
                            type='submit'
                            disabled={isLoading}
                        >
                            {isLoading && (
                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            )}
                            Sign in
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className='flex justify-center'>
                    <p className='text-xs text-stone-500'>
                        Authorized access only.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
