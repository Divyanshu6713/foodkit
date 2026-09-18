"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Droplets, RotateCcw } from "lucide-react";
import { CARTRIDGE, getTarget, type TargetId } from "@/content/research";
import { Container, Section, SectionHeader } from "@/components/ui/Section";
import { Button } from "@/components/ui/Chip";
import { EvidenceBadge } from "@/components/ui/EvidenceBadge";
import { CanvasFallback, LazyMount } from "@/components/three/LazyMount";
import { STRIP_ZONES, type ZoneId } from "@/components/three/stripTexture";

const CartridgeScene = dynamic(() => import("./CartridgeScene"), { ssr: false, loading: () => <CanvasFallback /> });

const PARTS = [
  { k: "Paper substrate", v: "Whatman Grade 4 filter paper, 2 × 6 cm" },
  { k: "Microfluidic channels", v: "Hydrophilic paper paths bounded by a printed hydrophobic barrier. Capillary action moves the sample; no pump is needed." },
  { k: "Sample inlet", v: CARTRIDGE.volume },
  { k: "Holder", v: CARTRIDGE.holder },
  { k: "Storage", v: CARTRIDGE.storage },
];

export function Cartridge() {
  const [playKey, setPlayKey] = useState(0);
  const [focus, setFocus] = useState<ZoneId | null>(null);
  const [present, setPresent] = useState<Record<TargetId, boolean>>({ urea: true, detergent: false, starch: true, h2o2: false, leadchromate: false });

  const toggle = (t: TargetId) => setPresent((p) => ({ ...p, [t]: !p[t] }));

  return (
    <Section id="cartridge" className="py-24 md:py-32">
      <Container>
        <SectionHeader
          index="06"
          eyebrow="Disposable cartridge"
          title="One drop, several tests at once"
          lead="The proposed cartridge is a wax-patterned paper strip with reagents dried into separate zones. Choose which adulterants the simulated milk contains, add the sample, and watch capillary flow carry it to each zone."
          aside={<EvidenceBadge type="proposed" long />}
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="relative h-[460px] overflow-hidden rounded-3xl border border-line-2 bg-[radial-gradient(ellipse_at_50%_35%,#10202a,#05080b_75%)] sm:h-[560px]">
            <LazyMount className="absolute inset-0">
              <CartridgeScene playKey={playKey} present={present} focus={focus} />
            </LazyMount>
            <div className="pointer-events-none absolute top-3 left-3 flex gap-2">
              <span className="mono rounded-full bg-bg/70 px-3 py-1 text-[10px] tracking-widest text-text-2 uppercase backdrop-blur">Drag to rotate</span>
              <EvidenceBadge type="sim" />
            </div>
            <div className="absolute inset-x-0 bottom-4 flex justify-center">
              <Button onClick={() => setPlayKey((k) => k + 1)}>
                {playKey ? <RotateCcw className="h-4 w-4" /> : <Droplets className="h-4 w-4" />}
                {playKey ? "New strip · add sample again" : "Add 50–100 µL milk sample"}
              </Button>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <div className="eyebrow mb-3">Test zones</div>
              <ul className="space-y-2">
                {STRIP_ZONES.map((z) => {
                  const isCtrl = z.id === "control";
                  const t = !isCtrl ? getTarget(z.id as TargetId) : null;
                  const reagent = CARTRIDGE.reagents.find((r) => r.target === z.id)?.reagent;
                  return (
                    <li
                      key={z.id}
                      onMouseEnter={() => setFocus(z.id)}
                      onMouseLeave={() => setFocus(null)}
                      className={`rounded-xl border p-3 transition-colors ${focus === z.id ? "border-nano bg-nano/5" : "border-line-2 bg-surface/50"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="mono flex h-6 w-6 items-center justify-center rounded-md border border-line-2 text-[11px] text-nano">{z.label}</span>
                          <span className="text-sm font-medium">{z.name}</span>
                        </div>
                        {!isCtrl && (
                          <label className="flex cursor-pointer items-center gap-2 text-xs text-text-2">
                            <span>{present[z.id as TargetId] ? "present" : "absent"}</span>
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={present[z.id as TargetId]}
                              onChange={() => toggle(z.id as TargetId)}
                              aria-label={`Simulate ${z.name} present`}
                            />
                            <span className="relative h-5 w-9 rounded-full bg-line-2 transition-colors peer-checked:bg-nano peer-focus-visible:ring-2 peer-focus-visible:ring-nano after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-text after:transition-transform peer-checked:after:translate-x-4" />
                          </label>
                        )}
                      </div>
                      <p className="mt-1.5 text-xs text-text-2">
                        {isCtrl ? CARTRIDGE.controls[0] : `Reagent: ${reagent} → ${t!.methods[0].signal.toLowerCase()}`}
                      </p>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-xs text-text-2">A reference color patch along the strip edge lets the app auto-calibrate each session.</p>
            </div>
            <dl className="space-y-3 border-t border-line pt-4">
              {PARTS.map((p) => (
                <div key={p.k}>
                  <dt className="mono text-[10px] tracking-widest text-muted uppercase">{p.k}</dt>
                  <dd className="mt-0.5 text-sm text-text-2">{p.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Container>
    </Section>
  );
}
