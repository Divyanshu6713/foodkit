"use client";
import type { ReactNode } from "react";

export function Chip({
  active,
  onClick,
  children,
  disabled,
  className = "",
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "border-nano bg-nano/15 text-nano"
          : "border-line-2 bg-surface/60 text-text-2 hover:border-nano/50 hover:text-text"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const base =
    "group inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40";
  const v =
    variant === "primary"
      ? "bg-nano text-bg hover:bg-[#7af0d5] shadow-[0_0_30px_-8px_var(--nano)]"
      : "border border-line-2 bg-surface/50 text-text hover:border-nano/60 hover:text-nano";
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${v} ${className}`}>
      {children}
    </button>
  );
}
