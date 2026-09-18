# NanoFood Kit — interactive research site

An immersive 3D website for the student project **"Development of a Portable Nano-Engineered Rapid Food Testing Kit for On-Site Detection of Food Adulterants and Contaminants."**

The project is at the research and design stage. Everything on the site is labelled with one of four evidence tags:

| Tag | Meaning |
| --- | --- |
| `LIT` | Value reported by a cited third-party study, FSSAI release or vendor listing |
| `PROPOSED` | Part of the project's planned design; not built or validated yet |
| `SIMULATED` | Generated in the browser for demonstration; nothing is measured |
| `CONCEPT` | Illustrative picture of a mechanism; not to scale |

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (static)
```

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · three.js + React Three Fiber + Drei · Motion · Zustand · Lucide.

## Where things live

```
src/content/research.ts     ← single source of truth for every scientific value (with evidence tags)
src/content/device.ts       ← reader components: name, function, role, explanation, explode offsets
src/components/three/       ← shared 3D: Device model, paper-strip texture, lights, lazy canvas mount
src/components/nano/        ← nanoscale engine: AgNP/AuNP aggregation, Ag/GO electrode, starch–iodine, indicators
src/components/sections/    ← one folder per page section (hero, samples, testdemo, journey, nanolab, …)
src/lib/                    ← color model, colorimetry model, store, pointer, in-view hooks
```

To change a number, edit `src/content/research.ts`, not the components. The brand name ("NanoFood Kit") is a working name set in `BRAND` in the same file.

## Page sections

1. Hero: interactive 3D reader (mouse parallax, hover highlight, click to fly to a part, **Explore device** exploded view with labels)
2. The problem: FSSAI 2024–25 enforcement data and the limits of lab testing
3. What are you testing?: 3D food samples, with scope status per food
4. Test a sample: six-step simulated workflow (drop → capillary flow → cartridge insert → scan → nanoscale view → signal → result)
5. Scroll journey: macro → micro → molecular → analyte → sensor → detection → signal → data → result
6. Nanotechnology lab: AgNP, AuNP, GO and Ag/GO mechanisms, each with a playable detection sequence
7. Disposable cartridge: rotatable 3D paper µPAD with animated capillary flow and zone reactions
8. How it works: seven scroll-activated steps
9. System architecture and electronics: PCB-style view with optical / electrochemical / power paths and a BOM with INR prices
10. Smartphone app mock-up and interactive colorimetry (concentration slider → color → RGB → estimate)
11. Data (literature values only), adulterant database, technology landscape, roadmap, risks
12. Scientific integrity: evidence legend, inconsistencies found in the source, references

## Notes

- Heavy WebGL canvases mount only near the viewport (`LazyMount`), so only one or two WebGL contexts are live at a time.
- The `react-hooks/immutability` lint rule is off for 3D files only, because R3F animates by mutating three.js objects inside `useFrame`.
- The simulated results use scenario presets (clean / adulterated) and a generic saturating color model. Neither is fitted to measured data.
