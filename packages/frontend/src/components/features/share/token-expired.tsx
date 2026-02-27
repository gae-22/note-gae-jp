import { LuClock, LuArrowLeft } from 'react-icons/lu';
import { Link } from '@tanstack/react-router';
import { MeshGradient, GrainOverlay } from '../../ui/decorative';

export function TokenExpiredPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none"><MeshGradient /></div>
      <GrainOverlay opacity={0.12} />

      <div className="relative z-10 w-full max-w-sm mx-auto px-6 text-center animate-[slide-up_0.6s_var(--ease-spring)_both]">
        <div className="rounded-2xl border border-white/[0.07] bg-white/4 backdrop-blur-2xl p-10 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.4)]">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/60 border border-zinc-700/60">
            <LuClock size={30} className="text-zinc-400 animate-glow-pulse" />
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-zinc-50 mb-3">Link Expired</h1>
          <p className="text-zinc-400 text-sm leading-relaxed mb-8">
            This share link has expired or been revoked. Please ask the note owner for a new link.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:text-indigo-400 hover:border-indigo-500/30 hover:bg-indigo-500/8 transition-all"
          >
            <LuArrowLeft size={14} />
            View Public Notes
          </Link>
        </div>
        <p className="text-zinc-600 mt-8 text-[11px] font-mono tracking-widest">© 2026 gae</p>
      </div>
    </div>
  );
}
