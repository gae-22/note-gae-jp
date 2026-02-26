import { LuDiamond, LuClock, LuArrowRight } from 'react-icons/lu';
import { Link } from '@tanstack/react-router';

export function TokenExpiredPage() {
    return (
        <div className='min-h-screen bg-void-900 flex items-center justify-center'>
            <div className='text-center animate-[slide-up_0.4s_var(--ease-out)]'>
                <LuDiamond className='mx-auto text-accent-500 mb-6' size={24} />
                <p className='font-heading font-bold text-void-50 mb-6'>
                    note.gae
                </p>

                <LuClock className='mx-auto text-void-300 mb-4' size={32} />
                <h1 className='font-heading text-xl font-bold text-void-50 mb-3'>
                    Link Expired
                </h1>
                <p className='text-void-200 text-sm mb-8 max-w-sm'>
                    This share link has expired or been revoked. Please contact
                    the note owner for a new link.
                </p>

                <Link
                    to='/'
                    className='inline-flex items-center gap-2 px-5 py-2.5 bg-accent-500 text-void-900 text-sm font-medium rounded-lg hover:bg-accent-400 transition-colors'
                >
                    Go to Home
                    <LuArrowRight size={14} />
                </Link>
            </div>
        </div>
    );
}
