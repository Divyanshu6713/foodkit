import type { Metadata, Viewport } from "next";
import { NanoSenseApp } from "@/components/nanosense/NanoSenseApp";

export const metadata: Metadata = {
  title: "NanoSense | Drishya",
  description:
    "From physical chemical reaction to digital adulteration detection: an interactive demonstration of Drishya's proposed nano-sensing, optical measurement, ESP32 and calibration pipeline. Digital stages are simulated.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fa" },
    { media: "(prefers-color-scheme: dark)", color: "#070b12" },
  ],
  colorScheme: "light dark",
};

export default function NanoSensePage() {
  return <NanoSenseApp />;
}
