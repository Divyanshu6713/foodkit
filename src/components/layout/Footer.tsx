import { BRAND } from "@/content/research";
import { DrishyaLogo } from "@/components/brand/DrishyaLogo";

export function Footer() {
  return (
    <footer className="border-t border-line py-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-start md:justify-between lg:px-8">
        <div className="max-w-md">
          <DrishyaLogo className="-ml-1 h-12 w-auto" />
          <p className="mt-3 text-sm text-text-2">{BRAND.title}.</p>
          <p className="mt-2 text-xs text-muted">{BRAND.status}. All device renders, simulations and results on this site are illustrative.</p>
        </div>
        <div className="text-xs text-muted md:text-right">
          <div className="text-sm font-medium text-text">{BRAND.headline}</div>
          <div className="mt-1">Food Safety × Nanotechnology × Portable Diagnostics</div>
          <div className="mt-4">Student engineering / research project</div>
        </div>
      </div>
    </footer>
  );
}
