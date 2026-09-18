import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/hero/Hero";
import { Problem } from "@/components/sections/problem/Problem";
import { Samples } from "@/components/sections/samples/Samples";
import { TestDemo } from "@/components/sections/testdemo/TestDemo";
import { Journey } from "@/components/sections/journey/Journey";
import { NanoLab } from "@/components/sections/nanolab/NanoLab";
import { Cartridge } from "@/components/sections/cartridge/Cartridge";
import { HowItWorks } from "@/components/sections/howitworks/HowItWorks";
import { Architecture } from "@/components/sections/architecture/Architecture";
import { Electronics } from "@/components/sections/electronics/Electronics";
import { PhoneApp } from "@/components/sections/phone/PhoneApp";
import { Colorimetry } from "@/components/sections/colorimetry/Colorimetry";
import { DataViz } from "@/components/sections/data/DataViz";
import { Database } from "@/components/sections/database/Database";
import { Landscape } from "@/components/sections/landscape/Landscape";
import { Roadmap } from "@/components/sections/roadmap/Roadmap";
import { Integrity } from "@/components/sections/integrity/Integrity";

/**
 * The page tells one story:
 * sample → kit → cartridge → nano-sensing → signal → data → result → safer food.
 */
export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Problem />
        <Samples />
        <TestDemo />
        <Journey />
        <NanoLab />
        <Cartridge />
        <HowItWorks />
        <Architecture />
        <Electronics />
        <PhoneApp />
        <Colorimetry />
        <DataViz />
        <Database />
        <Landscape />
        <Roadmap />
        <Integrity />
      </main>
      <Footer />
    </>
  );
}
