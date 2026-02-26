import { LuDiamond, LuClock, LuArrowRight } from 'react-icons/lu';
import { Link } from '@tanstack/react-router';

export function TokenExpiredPage() {
  return (
    <div className="bg-void-900 flex min-h-screen items-center justify-center">
      <div className="animate-[slide-up_0.4s_var(--ease-out)] text-center">
        <LuDiamond className="text-accent-500 mx-auto mb-6" size={24} />
        <p className="font-heading text-void-50 mb-6 font-bold">note.gae</p>

        <LuClock className="text-void-300 mx-auto mb-4" size={32} />
        <h1 className="font-heading text-void-50 mb-3 text-xl font-bold">Link Expired</h1>
        <p className="text-void-200 mb-8 max-w-sm text-sm">
          This share link has expired or been revoked. Please contact the note owner for a new link.
        </p>

        <Link
          to="/"
          className="bg-accent-500 text-void-900 hover:bg-accent-400 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
        >
          Go to Home
          <LuArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
