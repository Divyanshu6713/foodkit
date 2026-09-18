import type { Evidence } from "./research";

/**
 * Parts of the proposed reader, as described in section 5 of the research
 * (system architecture + component suggestions). Geometry lives in
 * components/three/device; this file holds the words and explode layout.
 */

export type PartId =
  | "enclosure"
  | "display"
  | "status"
  | "optics"
  | "cartridge"
  | "sensing"
  | "electrode"
  | "adc"
  | "mcu"
  | "battery";

export interface DevicePart {
  id: PartId;
  name: string;
  spec: string;
  fn: string;
  role: string;
  tech: string;
  evidence: Evidence;
  /** exploded-view offset [x, y, z] in scene units */
  explode: [number, number, number];
  /** point (in assembled device space) the camera focuses on */
  focus: [number, number, number];
  /** order in the explode stack (top → bottom), used for labels */
  layer: number;
}

export const DEVICE_PARTS: DevicePart[] = [
  {
    id: "enclosure",
    name: "Enclosure",
    spec: "3D-printed PLA (~100 g) · ₹200–300",
    fn: "Houses the electronics and forms a closed, light-tight testing chamber around the cartridge.",
    role: "A dark chamber keeps illumination constant between tests, so color and absorbance readings are comparable.",
    tech: "The research lists a custom 3D-printed PLA enclosure. Ambient-light variability is a stated limitation of open smartphone colorimetry; an enclosed LED-lit chamber is the proposed remedy.",
    evidence: "proposed",
    explode: [0, 2.15, 0],
    focus: [0, 0.4, 0],
    layer: 0,
  },
  {
    id: "display",
    name: "OLED display",
    spec: '0.96" I²C OLED, 128×64 · ₹200',
    fn: "Standalone readout — no phone needed for a quick screen.",
    role: "Shows the processed result: Pass / Fail against the reference limit plus a numeric value.",
    tech: "Connected to the ESP32 over I²C. Output format proposed in the research: 'Pass/Fail (vs FSSAI limits) + numeric value'.",
    evidence: "proposed",
    explode: [0, 1.55, 0],
    focus: [-0.75, 0.42, -0.1],
    layer: 1,
  },
  {
    id: "status",
    name: "Indicator LEDs",
    spec: "Power · link · test state",
    fn: "Tell the user the device is on, connected, and whether a test is running.",
    role: "User feedback only — not part of the measurement.",
    tech: "Status indicators are a conceptual UI detail added for this visualization; the research specifies LEDs only for illumination.",
    evidence: "concept",
    explode: [0, 2.15, 0],
    focus: [-0.75, 0.42, 0.62],
    layer: 0,
  },
  {
    id: "optics",
    name: "Optical head",
    spec: "5 mm white + RGB LEDs (₹50) · BPW34 / TEMT6000 photodiode (₹30–100)",
    fn: "Illuminates the sensing zones and measures how much light they return.",
    role: "Converts a color change on the strip into an electrical signal (absorbance measurement).",
    tech: "LEDs provide illumination / excitation; the photodiode output is digitised by the ESP32 ADC or the 16-bit ADS1115. An ESP32-CAM (OV2640, ₹735–950) is an optional image-based alternative, as is the user's phone.",
    evidence: "proposed",
    explode: [0, 1.05, 0],
    focus: [0.75, 0.3, 0],
    layer: 2,
  },
  {
    id: "cartridge",
    name: "Cartridge holder",
    spec: "3D-printed, inclined geometry · ₹50 (reusable)",
    fn: "Holds the disposable paper strip at an angle and aligns its zones under the optics.",
    role: "Inclined geometry gives gravity-assisted flow of the 50–100 µL sample through the paper.",
    tech: "Design follows the inclined-holder approach of the IIT Kharagpur µPAD patent cited in the research. Reusable; only the strip is thrown away.",
    evidence: "proposed",
    explode: [0, 0.55, 0.55],
    focus: [0.75, 0.05, 0.3],
    layer: 3,
  },
  {
    id: "sensing",
    name: "Sensing strip",
    spec: "Whatman Grade 4 paper, 2 × 6 cm, 4–6 zones · ₹12",
    fn: "Disposable paper-microfluidic strip with reagents dried into separate test zones.",
    role: "This is where detection happens: each zone reacts with one adulterant and changes color.",
    tech: "Pre-loaded zones: urea (p-DMAB or AgNPs), detergent (bromothymol blue), starch (iodine–KI), H₂O₂ (guaiacol + peroxidase or AgNPs), plus a negative-control zone and reference color patch.",
    evidence: "proposed",
    explode: [0, 0.8, 0.55],
    focus: [0.75, 0.1, 0.3],
    layer: 3,
  },
  {
    id: "electrode",
    name: "Electrode port",
    spec: "Screen-printed carbon electrode (SPCE) · ₹100–200, reusable 10–20×",
    fn: "Accepts an Ag/GO-modified electrode strip for the electrochemical urea mode.",
    role: "Urea oxidises on the Ag/GO surface; the resulting current is proportional to concentration.",
    tech: "Literature benchmark for Ag/GO non-enzymatic urea sensing: LOD 0.11 mM, linear 1–10 mM, 36.8 µA/mM. Requires a potentiostat front-end (open-source ESP32 designs, ~₹800).",
    evidence: "proposed",
    explode: [0.95, 0.25, 0],
    focus: [1.55, 0.0, -0.3],
    layer: 4,
  },
  {
    id: "adc",
    name: "ADS1115 ADC",
    spec: "16-bit, 4-channel, I²C · ₹250",
    fn: "High-resolution analog-to-digital conversion.",
    role: "Digitises the small photodiode or electrode signals more finely than the ESP32's built-in ADC.",
    tech: "Suggested in the research 'for high-resolution electrochemical readout'. Communicates with the ESP32 over I²C.",
    evidence: "proposed",
    explode: [0, -0.15, 0],
    focus: [0.35, -0.1, -0.45],
    layer: 5,
  },
  {
    id: "mcu",
    name: "ESP32 microcontroller",
    spec: "ESP32 DevKit v1, 30-pin · ₹500–600",
    fn: "Runs the test sequence, reads the ADC, applies calibration and drives display + wireless.",
    role: "Turns a raw signal into a concentration estimate and a Pass / Fail result.",
    tech: "Dual-core, built-in Wi-Fi / Bluetooth, 18 ADC channels. Sends results to the phone or cloud (Google Sheets / ThingSpeak logging proposed).",
    evidence: "proposed",
    explode: [0, -0.15, 0],
    focus: [-0.5, -0.1, 0],
    layer: 5,
  },
  {
    id: "battery",
    name: "Battery pack",
    spec: "18650 Li-ion 2000 mAh + TP4056 charger · ₹300",
    fn: "Makes the reader fully portable.",
    role: "Powers the LEDs, sensor front-end, ESP32 and display in the field.",
    tech: "Research estimate: 2–3 days standby. TP4056 module handles charging.",
    evidence: "proposed",
    explode: [0, -0.8, 0],
    focus: [0, -0.28, 0.2],
    layer: 6,
  },
];

export const getPart = (id: PartId) => DEVICE_PARTS.find((p) => p.id === id)!;
