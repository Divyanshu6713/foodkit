"use client";
import { useId } from "react";

/** Glass test tube (SVG) with a coloured liquid. Purely illustrative. */
export function TestTube({
  colour,
  level = 0.62,
  label,
  className = "",
  bubbles = false,
}: {
  colour: string;
  level?: number;
  label?: string;
  className?: string;
  bubbles?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const top = 18;
  const bottom = 190;
  const liquidTop = bottom - (bottom - top - 10) * level;
  return (
    <svg viewBox="0 0 64 214" className={className} role="img" aria-label={label ? `Test tube: ${label}` : "Test tube"}>
      <defs>
        <clipPath id={`tube-${id}`}>
          <path d="M14 14 H50 V176 A18 18 0 0 1 14 176 Z" />
        </clipPath>
        <linearGradient id={`liq-${id}`} x1="0" x2="1">
          <stop offset="0" stopColor={colour} stopOpacity="0.8" />
          <stop offset="0.45" stopColor={colour} />
          <stop offset="1" stopColor={colour} stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id={`glass-${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="white" stopOpacity="0.55" />
          <stop offset="0.25" stopColor="white" stopOpacity="0.08" />
          <stop offset="0.8" stopColor="white" stopOpacity="0" />
          <stop offset="1" stopColor="white" stopOpacity="0.25" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#tube-${id})`}>
        <rect x="0" y={liquidTop} width="64" height="220" fill={`url(#liq-${id})`} style={{ transition: "fill 800ms ease, y 800ms ease" }} />
        <ellipse cx="32" cy={liquidTop} rx="18" ry="3" fill={colour} style={{ filter: "brightness(1.08)", transition: "fill 800ms ease" }} />
        {bubbles &&
          [0, 1, 2, 3].map((i) => (
            <circle key={i} cx={22 + i * 6} cy={bottom} r={1.4 + (i % 2)} fill="white" opacity="0.55">
              <animate attributeName="cy" from={bottom} to={liquidTop + 4} dur={`${2.2 + i * 0.5}s`} begin={`${i * 0.6}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;0.6;0" dur={`${2.2 + i * 0.5}s`} begin={`${i * 0.6}s`} repeatCount="indefinite" />
            </circle>
          ))}
        <rect x="0" y="0" width="64" height="214" fill={`url(#glass-${id})`} />
      </g>
      <path d="M14 14 H50 V176 A18 18 0 0 1 14 176 Z" fill="none" stroke="var(--ns-line-2)" strokeWidth="1.6" />
      <rect x="10" y="8" width="44" height="8" rx="3" fill="var(--ns-surface)" stroke="var(--ns-line-2)" strokeWidth="1.4" />
      <line x1="19" y1="30" x2="19" y2="160" stroke="white" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
