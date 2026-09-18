import { EVIDENCE, OPEN_QUESTIONS, REFERENCES, type Evidence } from "@/content/research";
import { Container, Section, SectionHeader } from "@/components/ui/Section";
import { EvidenceBadge } from "@/components/ui/EvidenceBadge";

export function Integrity() {
  return (
    <Section id="integrity" className="py-24 md:py-32">
      <Container>
        <SectionHeader
          index="16"
          eyebrow="Scientific integrity"
          title="What is real on this page"
          lead="This is a research-and-design stage project. Here is exactly how to read every number and animation on the site."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(Object.keys(EVIDENCE) as Evidence[]).map((k) => (
            <div key={k} className="rounded-2xl border border-line-2 bg-surface/60 p-5">
              <EvidenceBadge type={k} long />
              <p className="mt-3 text-sm text-text-2">{EVIDENCE[k].desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-warn/30 bg-warn/5 p-6">
          <div className="eyebrow mb-3 !text-warn">Open questions and inconsistencies in the source</div>
          <ul className="space-y-2">
            {OPEN_QUESTIONS.map((q) => (
              <li key={q} className="flex gap-3 text-sm text-text-2">
                <span className="mt-2 h-1 w-3 shrink-0 bg-warn" />
                {q}
              </li>
            ))}
          </ul>
        </div>

        <details className="group mt-10 rounded-3xl border border-line-2 bg-surface/40 p-6">
          <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-semibold">
            References ({REFERENCES.length} key sources)
            <span className="mono text-xs text-muted group-open:hidden">show</span>
            <span className="mono hidden text-xs text-muted group-open:inline">hide</span>
          </summary>
          <ol className="mt-5 grid gap-2 text-sm md:grid-cols-2">
            {REFERENCES.map((r) => (
              <li key={r.n} className="flex gap-3">
                <span className="mono w-8 shrink-0 text-muted">[{r.n}]</span>
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="break-words text-text-2 underline-offset-2 hover:text-nano hover:underline">
                  {r.label}
                </a>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-muted">Reference numbers match the project research study. Links are provided as listed there and have not been re-verified for this site.</p>
        </details>
      </Container>
    </Section>
  );
}
