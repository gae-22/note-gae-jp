import { memo } from 'react';

export const DotGridPattern = memo(
  ({
    width = 16,
    height = 16,
    cx = 1,
    cy = 1,
    cr = 1,
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
        className={`pointer-events-none absolute inset-0 h-full w-full fill-void-400/20 ${className || ''}`}
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
      className={`pointer-events-none absolute -z-10 h-72 w-72 rounded-full bg-accent-500/10 blur-[100px] ${className || ''}`}
      aria-hidden="true"
    />
  );
});
