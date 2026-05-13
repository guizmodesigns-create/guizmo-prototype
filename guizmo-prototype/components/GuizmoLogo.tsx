// Custom inline-SVG mark for Guizmo Designs / Charlotte Vehicle Wraps.
// A bold geometric "G" rendered as a torn vinyl edge — confident, local, not corporate.
import React from 'react';

export function GuizmoLogo({
  className = 'h-9 w-auto',
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        viewBox="0 0 40 40"
        fill="none"
        aria-label="Guizmo Designs"
        className="h-full w-auto"
      >
        <defs>
          <linearGradient id="g-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF7A31" />
            <stop offset="100%" stopColor="#FF5A0A" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="38" height="38" rx="9" fill="url(#g-grad)" />
        <path
          d="M28 14h-9a5 5 0 00-5 5v3a5 5 0 005 5h5v-5h-4"
          stroke="#0F1320"
          strokeWidth="3.5"
          strokeLinecap="square"
          strokeLinejoin="miter"
          fill="none"
        />
      </svg>
      {showWordmark && (
        <div className="leading-tight">
          <div className="font-display font-black uppercase tracking-tight text-white text-lg">
            Guizmo
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-orange-400">
            Charlotte Vehicle Wraps
          </div>
        </div>
      )}
    </div>
  );
}
