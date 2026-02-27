import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/hooks/use-auth';
import { LuEye, LuEyeOff, LuArrowRight, LuLoader } from 'react-icons/lu';
import { MeshGradient, GrainOverlay } from '../../ui/decorative';

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
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <MeshGradient />
      </div>
      <GrainOverlay opacity={0.12} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_40%,rgba(99,102,241,0.08)_0%,transparent_70%)]" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-100 mx-auto px-6 animate-[slide-up_0.6s_var(--ease-spring)_both]">
        <div className="rounded-2xl border border-white/[0.07] bg-white/4 backdrop-blur-2xl p-8 sm:p-10 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.4)]">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 mb-5 animate-float">
              <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-zinc-50">note.gae</h1>
            <p className="text-zinc-400 mt-1.5 text-sm">Welcome back</p>
          </div>

          {/* Error */}
          {error && (
            <div className="border border-red-500/20 bg-red-500/8 text-red-400 animate-shake rounded-xl px-4 py-3 text-sm mb-6 flex items-center gap-2.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label htmlFor="login-username" className="text-zinc-400 mb-2 block text-[11px] font-semibold tracking-widest uppercase">
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
                className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-600 transition-all duration-200 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white/6 hover:border-white/[0.14]"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="text-zinc-400 mb-2 block text-[11px] font-semibold tracking-widest uppercase">
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
                  className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-3 pr-11 text-sm text-zinc-50 placeholder:text-zinc-600 transition-all duration-200 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white/6 hover:border-white/[0.14]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3.5 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-md"
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
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_12px_-2px_rgba(99,102,241,0.4)] transition-all hover:shadow-[0_6px_20px_-2px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_12px_-2px_rgba(99,102,241,0.4)]"
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
          </form>
        </div>

        <p className="text-zinc-600 text-center text-[11px] font-mono tracking-widest mt-8">© 2026 gae</p>
      </div>
    </div>
  );
}
