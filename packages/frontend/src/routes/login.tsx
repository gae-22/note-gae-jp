import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { rpc } from '@/lib/rpc';

export const Route = createFileRoute('/login')({
    component: Login,
});

function Login() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const res = await rpc.auth.login.$post({
            json: { username, password },
        });

        if (res.ok) {
            router.invalidate(); // Refresh data
            router.navigate({ to: '/' });
        } else {
            setError('Invalid credentials');
        }
    };

    return (
        <div className='flex items-center justify-center min-h-screen bg-gray-50'>
            <div className='w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md'>
                <h2 className='text-2xl font-bold text-center'>Login</h2>
                {error && <p className='text-red-500 text-center'>{error}</p>}
                <form onSubmit={handleSubmit} className='space-y-4'>
                    <div>
                        <label className='block mb-1 text-sm font-medium'>
                            Username
                        </label>
                        <input
                            type='text'
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className='w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                            required
                        />
                    </div>
                    <div>
                        <label className='block mb-1 text-sm font-medium'>
                            Password
                        </label>
                        <input
                            type='password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className='w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                            required
                        />
                    </div>
                    <button
                        type='submit'
                        className='w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
}
