import { useState, FormEvent } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { LuDiamond, LuEye, LuEyeOff, LuArrowRight, LuLoader2 } from 'react-icons/lu';

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
    <div className="bg-void-900 relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(200,255,0,0.03)_0%,transparent_70%)]" />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 mx-4 w-full max-w-sm animate-[slide-up_0.4s_var(--ease-out)]"
      >
        {/* Logo */}
        <div className="mb-10 flex items-center justify-center gap-2">
          <LuDiamond className="text-accent-500" size={24} />
          <span className="font-heading text-void-50 text-xl font-bold tracking-tight">
            note.gae
          </span>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="bg-void-700 border-glass-border text-void-50 placeholder:text-void-300 focus:border-accent-500 w-full rounded-lg border px-4 py-3 transition-colors duration-200 focus:outline-none"
              autoComplete="username"
              autoFocus
            />
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="bg-void-700 border-glass-border text-void-50 placeholder:text-void-300 focus:border-accent-500 w-full rounded-lg border px-4 py-3 pr-12 transition-colors duration-200 focus:outline-none"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-void-300 hover:text-void-100 absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
            </button>
          </div>
        </div>

        {/* Error */}
        {loginError && <p className="text-error mt-3 text-sm">{loginError}</p>}

        {/* Submit */}
        <button
          type="submit"
          disabled={loginPending || !username || !password}
          className="bg-accent-500 text-void-900 hover:bg-accent-400 mt-6 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition-all duration-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loginPending ? (
            <LuLoader2 size={18} className="animate-spin" />
          ) : (
            <>
              Sign In
              <LuArrowRight size={16} />
            </>
          )}
        </button>

        {/* Footer */}
        <p className="text-void-300 mt-8 text-center text-xs">© 2026 gae</p>
      </form>
    </div>
  );
}
