import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/hooks/use-auth';
import { LuDiamond, LuEye, LuEyeOff, LuArrowRight, LuLoader } from 'react-icons/lu';

export function LoginPage() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate({ to: '/dashboard' });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login({ username, password });
      navigate({ to: '/dashboard' });
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-void-900 relative flex min-h-screen items-center justify-center">
      {/* Subtle radial gradient accent */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(200,255,0,0.04)_0%,transparent_70%)]" />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-sm animate-[slide-up_0.4s_var(--ease-out)] space-y-6 px-6"
      >
        {/* Logo */}
        <div className="mb-8 text-center">
          <LuDiamond className="text-accent-500 mx-auto mb-3" size={32} />
          <h1 className="font-heading text-void-50 text-xl font-bold">note.gae</h1>
          <p className="text-void-300 mt-1 text-sm">Welcome back</p>
        </div>

        {/* Error */}
        {error && (
          <div className="border-error/30 bg-error/10 text-error animate-[shake_0.4s_var(--ease-out)] rounded-lg border px-4 py-2.5 text-sm">
            {error}
          </div>
        )}

        {/* Username */}
        <div>
          <label
            htmlFor="login-username"
            className="text-void-200 mb-1.5 block text-xs font-medium"
          >
            Username
          </label>
          <input
            id="login-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            required
            autoFocus
            className={`bg-void-700 text-void-50 placeholder:text-void-400 w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none ${
              error ? 'border-error' : 'border-glass-border focus:border-accent-500'
            }`}
          />
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="login-password"
            className="text-void-200 mb-1.5 block text-xs font-medium"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              className={`bg-void-700 text-void-50 placeholder:text-void-400 w-full rounded-lg border px-4 py-2.5 pr-10 text-sm transition-colors focus:outline-none ${
                error ? 'border-error' : 'border-glass-border focus:border-accent-500'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-void-300 hover:text-void-100 absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <LuEyeOff size={16} /> : <LuEye size={16} />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || !username || !password}
          className="bg-accent-500 text-void-900 hover:bg-accent-400 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isSubmitting ? (
            <LuLoader size={16} className="animate-spin" />
          ) : (
            <>
              Sign In
              <LuArrowRight size={16} />
            </>
          )}
        </button>

        <p className="text-void-300 text-center text-xs">© 2026 gae</p>
      </form>
    </div>
  );
}
