import { useState, FormEvent } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
    LuDiamond,
    LuEye,
    LuEyeOff,
    LuArrowRight,
    LuLoader2,
} from 'react-icons/lu';

export function LoginPage() {
    const { login, loginError, loginPending } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        await login({ username, password });
    };

    return (
        <div className='min-h-screen flex items-center justify-center bg-void-900 relative overflow-hidden'>
            {/* Subtle radial glow */}
            <div className='absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(200,255,0,0.03)_0%,transparent_70%)]' />

            <form
                onSubmit={handleSubmit}
                className='relative z-10 w-full max-w-sm mx-4 animate-[slide-up_0.4s_var(--ease-out)]'
            >
                {/* Logo */}
                <div className='flex items-center justify-center gap-2 mb-10'>
                    <LuDiamond className='text-accent-500' size={24} />
                    <span className='font-heading text-xl font-bold text-void-50 tracking-tight'>
                        note.gae
                    </span>
                </div>

                {/* Fields */}
                <div className='space-y-4'>
                    <div>
                        <input
                            id='username'
                            type='text'
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder='Username'
                            className='w-full px-4 py-3 bg-void-700 border border-glass-border rounded-lg text-void-50 placeholder:text-void-300 focus:outline-none focus:border-accent-500 transition-colors duration-200'
                            autoComplete='username'
                            autoFocus
                        />
                    </div>
                    <div className='relative'>
                        <input
                            id='password'
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder='Password'
                            className='w-full px-4 py-3 pr-12 bg-void-700 border border-glass-border rounded-lg text-void-50 placeholder:text-void-300 focus:outline-none focus:border-accent-500 transition-colors duration-200'
                            autoComplete='current-password'
                        />
                        <button
                            type='button'
                            onClick={() => setShowPassword(!showPassword)}
                            className='absolute right-3 top-1/2 -translate-y-1/2 text-void-300 hover:text-void-100 transition-colors'
                            aria-label={
                                showPassword ? 'Hide password' : 'Show password'
                            }
                        >
                            {showPassword ? (
                                <LuEyeOff size={18} />
                            ) : (
                                <LuEye size={18} />
                            )}
                        </button>
                    </div>
                </div>

                {/* Error */}
                {loginError && (
                    <p className='mt-3 text-sm text-error'>{loginError}</p>
                )}

                {/* Submit */}
                <button
                    type='submit'
                    disabled={loginPending || !username || !password}
                    className='mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent-500 text-void-900 font-medium rounded-lg hover:bg-accent-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 active:scale-[0.98]'
                >
                    {loginPending ? (
                        <LuLoader2 size={18} className='animate-spin' />
                    ) : (
                        <>
                            Sign In
                            <LuArrowRight size={16} />
                        </>
                    )}
                </button>

                {/* Footer */}
                <p className='mt-8 text-center text-xs text-void-300'>
                    © 2026 gae
                </p>
            </form>
        </div>
    );
}
