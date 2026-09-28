"use client";
import { motion } from "motion/react";
import { Atom, Calculator, Cpu, Eye, FileCheck, FlaskConical, Milk, ScanLine, Target } from "lucide-react";
import { HOW, NANO_DISCLAIMER } from "@/content/nanosense";
import { go, useOverlay } from "../nav";
import { Btn, Card, Note, StepHeader, Tag } from "../ui";
import { TechStack } from "./Landing";

const ICONS = [Milk, Target, FlaskConical, Atom, Eye, ScanLine, Cpu, Calculator, FileCheck];

export function HowItWorks() {
  const open = useOverlay((s) => s.open);
  return (
    <>
      <StepHeader title="How It Works" lead="The science behind each stage, in plain language. Coloured tags show which parts are demonstrated physically and which are simulated." />
      <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {HOW.map((h, i) => {
          const Icon = ICONS[i];
          return (
            <motion.li
              key={h.key}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.06 }}
            >
              <Card className="h-full p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-ns-blue/10 text-ns-blue">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="mono text-[11px] font-bold text-ns-muted">{h.key}</div>
                      <h2 className="text-[15.5px] leading-tight font-semibold">{h.title}</h2>
                    </div>
                  </div>
                  <Tag c={h.category} />
                </div>
                <p className="mt-3 text-[13.5px] leading-relaxed text-ns-text2">{h.text}</p>
              </Card>
            </motion.li>
          );
        })}
      </ol>
      <Note tone="warn" className="mt-5">
        {NANO_DISCLAIMER}
      </Note>
      <h2 className="mt-12 mb-4 text-lg font-semibold">Technology stack</h2>
      <TechStack />
      <div className="mt-8 flex flex-wrap gap-3">
        <Btn onClick={() => go("setup")} icon>
          Start Demonstration
        </Btn>
        <Btn variant="secondary" onClick={() => open("follow")}>
          Follow the Sample
        </Btn>
      </div>
    </>
  );
}
