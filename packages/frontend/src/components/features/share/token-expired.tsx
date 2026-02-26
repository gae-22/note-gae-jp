import { LuDiamond, LuClock, LuArrowLeft } from 'react-icons/lu';
import { Link } from '@tanstack/react-router';

export function TokenExpiredPage() {
  return (
    <div className="bg-void-900 flex min-h-screen items-center justify-center">
      <div className="animate-[slide-up_0.4s_var(--ease-out)] text-center">
        <LuClock size={48} className="text-void-300 mx-auto mb-6" />
        <h1 className="font-heading text-void-50 mb-2 text-2xl font-bold">Link Expired</h1>
        <p className="text-void-300 mb-8 max-w-sm text-sm">
          This share link has expired or been revoked. Please ask the note owner for a new link.
        </p>
        <Link
          to="/"
          className="bg-void-700 text-void-100 hover:bg-void-600 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors"
        >
          <LuArrowLeft size={14} />
          View Public Notes
        </Link>
        <p className="text-void-400 mt-8 text-xs">© 2026 gae</p>
      </div>
    </div>
  );
}
