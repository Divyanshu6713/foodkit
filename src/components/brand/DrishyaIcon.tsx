/**
 * The Drishya "splash badge" icon, for places the wordmark can't fit.
 * `small` is the optical-size variant for ≤ 32 px (heavier D, single drop).
 * Decorative by default; pass `label` when the icon stands alone.
 */
export function DrishyaIcon({
  small = false,
  label,
  className = "h-6 w-6",
}: {
  small?: boolean;
  label?: string;
  className?: string;
}) {
  const src = small ? "/brand/drishya-icon-small.svg" : "/brand/drishya-icon.svg";
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={label ?? ""} aria-hidden={label ? undefined : true} width={512} height={512} className={className} />;
}
