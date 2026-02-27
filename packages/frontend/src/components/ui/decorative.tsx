import { memo } from 'react';

export const DotGridPattern = memo(
  ({
    width = 16,
    height = 16,
    cx = 1,
    cy = 1,
    cr = 0.8,
    className,
    ...props
  }: React.SVGProps<SVGSVGElement> & {
    width?: number;
    height?: number;
    cx?: number;
    cy?: number;
    cr?: number;
  }) => {
    return (
      <svg
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 h-full w-full fill-current ${className || ''}`}
        {...props}
      >
        <defs>
          <pattern
            id="dotPattern"
            width={width}
            height={height}
            patternUnits="userSpaceOnUse"
            patternContentUnits="userSpaceOnUse"
          >
            <circle id="pattern-circle" cx={cx} cy={cy} r={cr} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" strokeWidth={0} fill="url(#dotPattern)" />
      </svg>
    );
  }
);

export const AmbientGlow = memo(({ className }: { className?: string }) => {
  return (
    <div
      className={`pointer-events-none absolute -z-10 h-72 w-72 rounded-full blur-[100px] ${className || ''}`}
      aria-hidden="true"
    />
  );
});

/**
 * Full-viewport grain/noise texture overlay.
 * Adds that "tactile" feel to any surface — a key 2026 trend.
 */
export const GrainOverlay = memo(({ className, opacity = 0.3 }: { className?: string; opacity?: number }) => {
  return (
    <div
      className={`pointer-events-none fixed inset-0 z-50 ${className || ''}`}
      aria-hidden="true"
      style={{ opacity, mixBlendMode: 'overlay' }}
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <filter id="grain-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-noise)" />
      </svg>
    </div>
  );
});

/**
 * Multi-stop animated mesh gradient background.
 * Creates the "liquid" ambient feel of neo-glassmorphism.
 */
export const MeshGradient = memo(({ className }: { className?: string }) => {
  return (
    <div
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className || ''}`}
      aria-hidden="true"
    >
      {/* Primary gradient blob */}
      <div
        className="absolute -top-1/4 -left-1/4 w-3/4 h-3/4 rounded-full opacity-20 dark:opacity-10 animate-float"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
      {/* Secondary gradient blob */}
      <div
        className="absolute -bottom-1/4 -right-1/4 w-2/3 h-2/3 rounded-full opacity-15 dark:opacity-8 animate-float"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animationDelay: '-3s',
          animationDirection: 'reverse',
        }}
      />
      {/* Tertiary warm accent */}
      <div
        className="absolute top-1/3 right-1/4 w-1/2 h-1/2 rounded-full opacity-10 dark:opacity-5 animate-float"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animationDelay: '-1.5s',
        }}
      />
    </div>
  );
});

/**
 * Animated aurora-style ambient glow effect.
 * More dramatic than MeshGradient — for hero sections.
 */
export const AuroraGlow = memo(({ className }: { className?: string }) => {
  return (
    <div
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className || ''}`}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 40%, rgba(99,102,241,0.15) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 20%, rgba(139,92,246,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 40% 60% at 50% 80%, rgba(59,130,246,0.08) 0%, transparent 60%)
          `,
          animation: 'gradient-shift 12s ease-in-out infinite',
          backgroundSize: '200% 200%',
        }}
      />
    </div>
  );
});
