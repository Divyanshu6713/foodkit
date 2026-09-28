"use client";
import { CircleCheck, CircleDashed } from "lucide-react";
import { STATUS } from "@/content/nanosense";
import { StepHeader, Note } from "../ui";
import { TechStack } from "./Landing";

const GROUPS = [
  { key: "physical", title: "Physically demonstrated", sub: "Done live, with a real sample.", tone: "text-ns-green", border: "!border-t-ns-green", done: true },
  { key: "digital", title: "Digitally demonstrated", sub: "Real computation on the photograph in this app.", tone: "text-ns-blue", border: "!border-t-ns-blue", done: true },
  { key: "simulated", title: "Simulated / proposed", sub: "Future hardware, shown to explain the pathway. Not built yet.", tone: "text-ns-amber", border: "!border-t-ns-amber", done: false },
  { key: "required", title: "Still required", sub: "Needed before any validated quantitative claim.", tone: "text-ns-text2", border: "!border-t-ns-line2", done: false },
] as const;

export function StatusLists() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {GROUPS.map((g) => (
        <div key={g.key} className={`ns-card border-t-4 p-6 ${g.border}`}>
          <div className={`mono text-[11px] font-semibold tracking-[0.16em] uppercase ${g.tone}`}>{g.title}</div>
          <p className="mt-1 text-[13px] text-ns-text2">{g.sub}</p>
          <ul className="mt-4 space-y-2.5">
            {STATUS[g.key].map((item) => (
              <li key={item} className={`flex items-center gap-2.5 text-[15px] ${g.done ? "" : "text-ns-text2"}`}>
                {g.done ? <CircleCheck className={`h-5 w-5 shrink-0 ${g.tone}`} /> : <CircleDashed className={`h-5 w-5 shrink-0 ${g.tone}`} />} {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function StatusPage() {
  return (
    <>
      <StepHeader title="Prototype Demonstration Status" lead="We want to be precise about what exists today and what this app simulates." />
      <StatusLists />
      <Note className="mt-6">
        The objective is not to fake a finished device. It is to show how our physical chemistry can become a portable digital detection system. Every simulated
        number in this app is labelled <b>Simulated</b> or <b>Demonstration</b>.
      </Note>
      <h2 className="mt-12 mb-4 text-lg font-semibold">Technology stack</h2>
      <TechStack />
    </>
  );
}
