import { useRouter } from '@tanstack/react-router';
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
import { Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export function LoginForm() {
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
                toast.success('Welcome back!');
                await router.invalidate();
                await router.navigate({ to: '/' });
            } else {
                setError('Invalid credentials');
                toast.error('Invalid credentials');
            }
        } catch {
            setError('An error occurred');
            toast.error('An error occurred during login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='flex items-center justify-center min-h-screen bg-background relative overflow-hidden'>
            {/* Ambient Background */}
            <div className='absolute inset-0 bg-linear-to-br from-primary/5 via-background to-secondary/10 -z-20' />
            <div className='absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[128px] -z-10 opacity-40 animate-pulse duration-10000' />
            <div className='absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[128px] -z-10 opacity-40 animate-pulse duration-7000' />

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className='w-full max-w-md px-4'
            >
                <div className='flex justify-center mb-8'>
                    <div className='bg-primary/10 p-3 rounded-2xl backdrop-blur-sm border border-primary/20 shadow-lg shadow-primary/10'>
                        <Sparkles className='h-8 w-8 text-primary' />
                    </div>
                </div>

                <Card className='border-border/40 bg-background/60 backdrop-blur-xl shadow-2xl shadow-black/5 overflow-hidden'>
                    <div className='absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-primary/50 to-transparent opacity-50' />
                    <CardHeader className='space-y-1 text-center pb-2'>
                        <CardTitle className='text-3xl font-bold tracking-tight'>
                            Welcome Back
                        </CardTitle>
                        <CardDescription className='text-base'>
                            Sign in to your NoteGAE workspace
                        </CardDescription>
                    </CardHeader>
                    <CardContent className='pt-6'>
                        <form onSubmit={handleSubmit} className='space-y-4'>
                            <div className='space-y-2'>
                                <Label htmlFor='username'>Username</Label>
                                <Input
                                    id='username'
                                    type='text'
                                    placeholder='Enter your username'
                                    value={username}
                                    onChange={(e) =>
                                        setUsername(e.target.value)
                                    }
                                    required
                                    autoFocus
                                    className='bg-background/50 border-input/50 focus:bg-background transition-colors h-11'
                                />
                            </div>
                            <div className='space-y-2'>
                                <div className='flex items-center justify-between'>
                                    <Label htmlFor='password'>Password</Label>
                                </div>
                                <Input
                                    id='password'
                                    type='password'
                                    placeholder='••••••••'
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    required
                                    className='bg-background/50 border-input/50 focus:bg-background transition-colors h-11'
                                />
                            </div>
                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className='text-sm text-red-500 font-medium text-center bg-red-500/10 py-2 rounded-md'
                                >
                                    {error}
                                </motion.p>
                            )}
                            <Button
                                className='w-full h-11 font-medium text-md shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]'
                                type='submit'
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                ) : (
                                    <span className='flex items-center'>
                                        Sign in{' '}
                                        <ArrowRight className='ml-2 h-4 w-4 opacity-70' />
                                    </span>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className='flex justify-center pb-6'>
                        <p className='text-xs text-muted-foreground opacity-50'>
                            Authorized access only
                        </p>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
}
