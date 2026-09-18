"use client";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { BRAND } from "@/content/research";
import { scrollToId } from "@/lib/store";

const LINKS = [
  { id: "samples", label: "Samples" },
  { id: "test", label: "Test demo" },
  { id: "journey", label: "Journey" },
  { id: "nano", label: "Nano" },
  { id: "cartridge", label: "Cartridge" },
  { id: "system", label: "System" },
  { id: "data", label: "Data" },
  { id: "database", label: "Database" },
];

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
        <circle cx="16" cy="16" r="14" fill="none" stroke="var(--nano)" strokeWidth="1.5" opacity="0.5" />
        <circle cx="16" cy="16" r="5" fill="var(--nano)" />
        <circle cx="16" cy="4.5" r="2.2" fill="var(--ag)" />
        <circle cx="26" cy="21.5" r="2.2" fill="var(--au)" />
        <circle cx="6" cy="21.5" r="2.2" fill="var(--signal)" />
      </svg>
      <span className="text-[15px] font-semibold tracking-tight">
        {BRAND.name}
        <span className="text-nano">{BRAND.suffix}</span>
      </span>
    </span>
  );
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    LINKS.forEach((l) => {
      const el = document.getElementById(l.id);
      if (el) io.observe(el);
    });
    return () => {
      window.removeEventListener("scroll", on);
      io.disconnect();
    };
  }, []);

  const go = (id: string) => {
    setOpen(false);
    scrollToId(id);
  };

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${scrolled || open ? "border-b border-line bg-bg/75 backdrop-blur-xl" : ""}`}>
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Main">
        <button type="button" onClick={() => go("top")} aria-label="Back to top">
          <Logo />
        </button>
        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => go(l.id)}
                className={`rounded-full px-3 py-1.5 text-sm transition-colors ${active === l.id ? "text-nano" : "text-text-2 hover:text-text"}`}
              >
                {l.label}
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => go("test")}
            className="hidden rounded-full bg-nano px-4 py-1.5 text-sm font-medium text-bg transition-colors hover:bg-[#7af0d5] sm:block"
          >
            Test a sample
          </button>
          <button type="button" className="rounded-md p-2 lg:hidden" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>
      {open && (
        <ul className="grid grid-cols-2 gap-1 border-t border-line px-4 py-3 lg:hidden">
          {LINKS.map((l) => (
            <li key={l.id}>
              <button type="button" onClick={() => go(l.id)} className="w-full rounded-md px-3 py-2 text-left text-sm text-text-2 hover:bg-surface hover:text-text">
                {l.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
