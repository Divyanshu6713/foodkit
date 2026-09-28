/**
 * NanoSense — the demonstration app at /nanosense.
 *
 * The app follows one chain:
 *   real sample → real physical test → real observed response → photograph →
 *   image processing → numerical optical feature → calibration data →
 *   estimated concentration.
 *
 * The first stages come from the team's laboratory work (REAL EXPERIMENT
 * mode). SIMULATION mode fills every stage with illustrative data so the whole
 * workflow can be shown. The two workspaces are kept apart and never mixed.
 *
 * A concentration is only ever computed from a calibration dataset. The app
 * never turns RGB values into a concentration without one.
 *
 * All chemistry lives in ASSAY. Edit it to match the validated laboratory
 * assay. The app never invents a reagent, quantity or nanoparticle mechanism.
 */

export type Category = "physical" | "digital" | "simulated" | "concept" | "literature";

export const CATEGORY: Record<Category, { label: string; short: string; desc: string }> = {
  physical: {
    label: "Physical Laboratory Demonstration",
    short: "Physical",
    desc: "Performed with a real sample in the laboratory.",
  },
  digital: {
    label: "Digital Analysis — Demonstrated",
    short: "Digital",
    desc: "Real computation in this app (ROI, RGB, feature, regression). Its output is only as good as its input photo and calibration data.",
  },
  simulated: {
    label: "Prototype Simulation / Proposed Pipeline",
    short: "Simulated",
    desc: "Proposed stage. The hardware does not exist yet; this app generates the values.",
  },
  concept: {
    label: "Conceptual illustration",
    short: "Concept",
    desc: "A simplified picture to explain a mechanism. Not to scale and not a measurement.",
  },
  literature: {
    label: "Published reference",
    short: "Literature",
    desc: "Reported by a published study. Supports the principle; not our measurement.",
  },
};

/* ------------------------------------------------------------------ */
/* Assay configuration (edit to match the validated laboratory assay)  */
/* ------------------------------------------------------------------ */

export const ASSAY = {
  /** Set to true once the fields below come from the validated lab SOP. */
  configured: false,
  sampleType: "Milk",
  target: "Urea",
  method: "Nano-enabled chemical/optical sensing",
  mode: "Colorimetric / Optical",
  assayName: "Validated laboratory assay (configure in nanosense.ts)",
  recognition: "Target-specific interaction defined by the validated assay",
  nanoLayer: "Nanoparticle-based sensing layer defined by the validated assay",
  readout: "Change in colour / optical intensity of the sensing system",
  /** Illustration colours only (nano animation, simulation images). Real colours come from photos. */
  colours: {
    control: "#efe9d6",
    positive: "#d69a2d",
  },
  nanoBase: "#3b82f6",
  /** Colour channel used for the optical feature by default (change in the Photograph Analysis page). */
  featureChannel: "B" as Channel,
  sensor: "Photodiode / optical colour sensor",
  microcontroller: "ESP32",
  adcBits: 12,
  adcRefVolts: 3.3,
};

export type Channel = "R" | "G" | "B";

/** Definition of the numerical optical feature, shown wherever the feature appears. */
export const FEATURE = {
  name: "Normalized optical feature",
  symbol: "F",
  formula: "F = −log₁₀(C_ROI / C_ref)",
  explain:
    "C is the mean value of the chosen colour channel. C_ref comes from a white-reference region in the same photo, which cancels most of the lighting. Without a white reference, 255 is used and the feature is uncorrected for lighting.",
};

/* ------------------------------------------------------------------ */
/* Samples                                                             */
/* ------------------------------------------------------------------ */

export type SampleKind = "control" | "reference" | "unknown";

export const SAMPLE_KINDS: { id: SampleKind; label: string; desc: string }[] = [
  { id: "control", label: "Control", desc: "Sample known to be free of the target. Shows what 'no response' looks like." },
  { id: "reference", label: "Reference Positive", desc: "Sample known to contain the target. Confirms the assay responds." },
  { id: "unknown", label: "Unknown Sample", desc: "The sample being screened." },
];

export const OBSERVATIONS = [
  "Analytical colour response detected",
  "Weak colour response observed",
  "No visible response",
] as const;

export const CONTROL_RUNS = [
  "Control and reference positive run alongside",
  "Control only run alongside",
  "No control run",
] as const;

export const DEFAULT_IDS: Record<SampleKind, string> = { control: "CTRL-001", reference: "REF-001", unknown: "MILK-001" };

/* ------------------------------------------------------------------ */
/* Simulation mode (illustrative, NOT experimental)                    */
/* ------------------------------------------------------------------ */

/**
 * Parameters of the illustrative dataset. The synthetic photos and the
 * illustrative calibration both follow F = f0 + k·c, so the simulation is
 * internally consistent. None of it is measured.
 */
export const DEMO = {
  unit: "RU",
  unitLong: "relative units (illustrative scale)",
  conc: { control: 0, reference: 10, unknown: 7 } as Record<SampleKind, number>,
  f0: 0.06,
  k: 0.065,
  white: 245,
  levels: [0, 2, 4, 6, 8, 10],
  replicates: 3,
  noise: 0.012,
};

/** Future-hardware simulation (ESP32 pages). Illustrative, not linked to any photo. */
export const SIM = {
  illustrativeAU: 0.68,
  darkVolts: 0.08,
  blankVolts: 2.6,
  noiseVolts: 0.018,
};

/** Calibration fitting rule: fit a model only with enough distinct levels. */
export const CAL_RULES = { minLevels: 3, minPoints: 3 };

export const CSV_COLUMNS = ["sample_id", "known_concentration", "optical_feature", "replicate", "notes"] as const;

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */

export type StepId =
  | "setup"
  | "physical"
  | "nano"
  | "compare-nano"
  | "image"
  | "calibration"
  | "references"
  | "unknown"
  | "comparison"
  | "esp32"
  | "processing"
  | "flow"
  | "report"
  | "summary";

export const STEPS: { id: StepId; short: string; title: string; category: Category }[] = [
  { id: "setup", short: "Setup", title: "Demonstration Setup", category: "physical" },
  { id: "physical", short: "Physical test", title: "Physical Test Result", category: "physical" },
  { id: "nano", short: "Nano-sensing", title: "How Does the Nano-Sensing Layer Work?", category: "concept" },
  { id: "compare-nano", short: "Before / after", title: "Before / After Nano Response", category: "concept" },
  { id: "image", short: "Photo analysis", title: "Photograph Analysis", category: "digital" },
  { id: "calibration", short: "Calibration", title: "Calibration", category: "digital" },
  { id: "references", short: "References", title: "Published Reference Data", category: "literature" },
  { id: "unknown", short: "Unknown", title: "Unknown Sample", category: "digital" },
  { id: "comparison", short: "Comparison", title: "Control vs Sample Comparison", category: "digital" },
  { id: "esp32", short: "ESP32", title: "Future Hardware Pathway", category: "simulated" },
  { id: "processing", short: "Processing", title: "Signal Processing (Future Hardware)", category: "simulated" },
  { id: "flow", short: "System flow", title: "Complete System Flow", category: "digital" },
  { id: "report", short: "Report", title: "Digital Result Report", category: "digital" },
  { id: "summary", short: "Judge summary", title: "Final Judge Screen", category: "physical" },
];

/* ------------------------------------------------------------------ */
/* Landing                                                             */
/* ------------------------------------------------------------------ */

export const PIPELINE: { label: string; category: Category }[] = [
  { label: "Real sample", category: "physical" },
  { label: "Real physical test", category: "physical" },
  { label: "Real observed response", category: "physical" },
  { label: "Photograph", category: "physical" },
  { label: "Image processing", category: "digital" },
  { label: "Numerical optical feature", category: "digital" },
  { label: "Calibration data", category: "digital" },
  { label: "Estimated concentration", category: "digital" },
];

export const STORY: { text: string; category: Category }[] = [
  { text: "We take a real milk sample and perform the physical chemical screening test.", category: "physical" },
  { text: "The nano-sensing layer produces a visible analytical response.", category: "physical" },
  { text: "We photograph the response next to a control and a reference positive.", category: "physical" },
  { text: "The app isolates the reaction region (ROI) and ignores the background.", category: "digital" },
  { text: "RGB values are extracted and turned into one normalized optical feature.", category: "digital" },
  { text: "Reference samples of known concentration build a calibration curve.", category: "digital" },
  { text: "Only with that calibration is a concentration estimated, never from RGB alone.", category: "digital" },
  { text: "Future hardware (optical sensor + ESP32) would automate the measurement.", category: "simulated" },
  { text: "The result is reported together with its source and validation status.", category: "digital" },
];

/* ------------------------------------------------------------------ */
/* Controlled imaging                                                  */
/* ------------------------------------------------------------------ */

export const IMAGING_NOTE =
  "Photographic color measurement depends on lighting, camera characteristics, distance, background and sample geometry. Therefore, quantitative use requires controlled imaging conditions and calibration.";

export const IMAGING_CHAIN = ["Fixed light", "Sample", "Camera", "Image", "ROI", "Colour extraction"];

/* ------------------------------------------------------------------ */
/* Nano-sensing explanation                                            */
/* ------------------------------------------------------------------ */

export const NANO_STAGES = [
  { title: "Target analyte enters sensing environment", text: "The target analyte, or a reaction product associated with it, reaches the nano-sensing layer." },
  { title: "Target-specific interaction", text: "The assay chemistry is designed so that the sensing layer interacts specifically with the target." },
  { title: "Change in nanoparticle optical response", text: "The interaction changes an optical property of the sensing system, such as intensity or spectral response." },
  { title: "Observable optical signal", text: "The change appears as a colour or intensity difference that can be seen and compared with a control." },
  { title: "Camera / optical sensor", text: "A camera today (a dedicated optical sensor in future hardware) records that optical signal." },
];

export const NANO_EXPLAINER =
  "The nanoparticle-based sensing layer is designed to interact with the target analyte or with a reaction product associated with it. This target-specific interaction changes an optical property of the sensing system, producing a nano-sensing response that can be observed and recorded.";

export const NANO_DISCLAIMER = "The exact sensing mechanism depends on the validated assay chemistry.";

/* ------------------------------------------------------------------ */
/* Published reference data (separate from our calibration)            */
/* ------------------------------------------------------------------ */

/**
 * Transcribed from the project's research review (see research.ts). Values are
 * as summarised there. Verify against the original paper before quoting.
 */
export const PUBLISHED: { method: string; principle: string; reported: string[]; supports: string; ref: number; relevance: "optical" | "other" }[] = [
  {
    method: "Citrate-capped silver-nanoparticle colorimetry (urea in milk)",
    principle: "A nanoparticle optical response changes with urea concentration and is read as a colour change.",
    reported: ["LOD 5.56 µM", "Linear range 1–15 mM", "< 5 min"],
    supports: "Nanoparticle optical response can track an analyte's concentration in milk.",
    ref: 10,
    relevance: "optical",
  },
  {
    method: "Paper microfluidic colorimetric device for milk adulterants (IIT Kharagpur, 2025)",
    principle: "Pre-loaded reagents on paper give colour responses to urea, starch, detergent, H₂O₂ and others.",
    reported: ["LOD 0.03 % (urea, H₂O₂)", "15–120 s", "Semi-quantitative without image analysis"],
    supports: "Rapid on-site colorimetric screening of milk is practical; quantitation needs image analysis.",
    ref: 17,
    relevance: "optical",
  },
  {
    method: "Smartphone optical detection (review)",
    principle: "A phone camera captures a colour or fluorescence response and an app analyses RGB values.",
    reported: ["Ambient light variability is a known limitation", "Calibration needed"],
    supports: "Camera-based colour measurement works only with controlled imaging and calibration.",
    ref: 21,
    relevance: "optical",
  },
  {
    method: "Ag/GO non-enzymatic electrochemical urea sensor",
    principle: "Urea is oxidised on a nanocomposite-modified electrode; current rises with concentration.",
    reported: ["LOD 0.11 mM", "Linear range 1–10 mM", "36.8 µA/mM"],
    supports: "A different (electrochemical) principle, relevant to a future module, not to the optical pathway.",
    ref: 14,
    relevance: "other",
  },
];

/* ------------------------------------------------------------------ */
/* Complete system flow (13 steps)                                     */
/* ------------------------------------------------------------------ */

export const FLOW: { title: string; category: Category; text: string }[] = [
  { title: "Food Sample", category: "physical", text: "A real milk sample is collected for screening. The system starts with one food and one target." },
  { title: "Sample Preparation", category: "physical", text: "The sample is prepared according to the laboratory procedure so that the assay can respond reliably." },
  { title: "Validated Chemical/Nano Assay", category: "physical", text: "The prepared sample is combined with the validated assay, which contains the nano-sensing layer." },
  { title: "Target-Specific Interaction", category: "physical", text: "The assay chemistry is designed to interact specifically with the target (urea) or a reaction product associated with it." },
  { title: "Nano-Sensing Response", category: "concept", text: "The interaction changes an optical property of the sensing system. The exact mechanism depends on the validated assay chemistry." },
  { title: "Visible Analytical Signal", category: "physical", text: "The optical change is seen as a colour or intensity difference compared with the control. This is demonstrated live." },
  { title: "Photograph", category: "physical", text: "The response is photographed next to a control and a reference positive, ideally under fixed lighting." },
  { title: "ROI & RGB Extraction", category: "digital", text: "The reaction region is selected, the background is ignored, glare is excluded and representative RGB values are extracted." },
  { title: "Optical Feature", category: "digital", text: "RGB values are converted into one normalized optical feature, referenced to a white area in the same photo." },
  { title: "Calibration Data", category: "digital", text: "Reference samples of known concentration link the optical feature to concentration. This requires experimental data." },
  { title: "Estimated Concentration", category: "digital", text: "Only when a calibration model exists is the unknown's feature converted into an estimated concentration." },
  { title: "Future Hardware (ESP32)", category: "simulated", text: "A dedicated optical sensor and ESP32 would automate acquisition. This stage is simulated." },
  { title: "Digital Report", category: "digital", text: "The result, its inputs, its data source and its validation status are reported together." },
];

/* ------------------------------------------------------------------ */
/* Follow the Sample                                                   */
/* ------------------------------------------------------------------ */

export const FOLLOW: { id: string; label: string; category: Category; happening: string; measured: string; simulated: string }[] = [
  { id: "milk", label: "Milk sample", category: "physical", happening: "A real milk sample is taken for screening.", measured: "Nothing yet. This is the starting material.", simulated: "Nothing in Real Experiment mode." },
  { id: "tube", label: "Test tube", category: "physical", happening: "The sample is prepared and placed in the laboratory test tube.", measured: "Nothing yet. Preparation follows the lab procedure.", simulated: "Nothing in Real Experiment mode." },
  { id: "reaction", label: "Sensing reaction", category: "physical", happening: "The validated assay is added and the sensing reaction takes place.", measured: "The response is compared by eye with a control.", simulated: "Nothing in Real Experiment mode. This is the live chemistry." },
  { id: "nano", label: "Nano response", category: "concept", happening: "The nano-sensing layer changes its optical response through a target-specific interaction.", measured: "A visible colour / intensity change compared with the control.", simulated: "Only the zoomed-in animation. The real mechanism depends on the validated assay chemistry." },
  { id: "photo", label: "Photograph", category: "physical", happening: "The response is photographed together with a white reference area.", measured: "A photo: the raw experimental input for digital analysis.", simulated: "Nothing in Real Experiment mode. Simulation mode uses a synthetic photo." },
  { id: "roi", label: "ROI & RGB", category: "digital", happening: "The reaction region is selected; background and glare are ignored.", measured: "Mean R, G, B values of the region, with their spread.", simulated: "Nothing. This is real image processing of the photo." },
  { id: "feature", label: "Optical feature", category: "digital", happening: "RGB values are turned into one normalized optical feature.", measured: "F = −log₁₀(C_ROI / C_ref) for the chosen colour channel.", simulated: "Nothing, but the feature is uncalibrated: it is not a concentration." },
  { id: "graph", label: "Calibration", category: "digital", happening: "The feature is placed on a curve built from reference samples of known concentration.", measured: "Position on the calibration curve.", simulated: "Only if the illustrative dataset is loaded (Simulation mode). Real use needs experimental data." },
  { id: "result", label: "Result", category: "digital", happening: "An estimated concentration is reported, or an explicit 'calibration required' message.", measured: "Estimated concentration with its uncertainty, only when calibration exists.", simulated: "Depends on the data source shown in the mode badge." },
  { id: "esp32", label: "Future hardware", category: "simulated", happening: "A dedicated optical sensor and ESP32 would automate this measurement.", measured: "Nothing today: the ESP32 is not connected to the physical test.", simulated: "Everything on this stage." },
];

/* ------------------------------------------------------------------ */
/* Transparency                                                        */
/* ------------------------------------------------------------------ */

export const STATUS = {
  physical: ["Food sample preparation", "Laboratory chemical screening", "Physical analytical response", "Visual observation", "Photograph of the response"],
  digital: ["ROI selection and background rejection", "RGB extraction from the photo", "Normalized optical feature", "Calibration fitting and residuals (software)"],
  simulated: ["Optical sensor", "ESP32 integration", "Automated signal acquisition", "Hardware signal processing", "Smartphone/web communication"],
  required: ["Experimental calibration dataset (reference standards)", "Controlled imaging conditions", "Repeatability and validation testing"],
};

/* ------------------------------------------------------------------ */
/* How it works (A–I)                                                  */
/* ------------------------------------------------------------------ */

export const HOW: { key: string; title: string; category: Category; text: string }[] = [
  { key: "A", title: "Food Sample", category: "physical", text: "Milk is the first sample. It is widely consumed, it is tested often, and adulteration can be hard to see by eye." },
  { key: "B", title: "Target Adulterant", category: "physical", text: "The system is designed to screen for urea in milk. One food and one target first keeps the chemistry and the calibration honest." },
  { key: "C", title: "Recognition Chemistry", category: "physical", text: "The validated assay produces a target-specific analytical response: the sample responds differently from a control when the target is present." },
  { key: "D", title: "Nanoparticles", category: "concept", text: "Nanoparticles can make a very responsive optical sensing interface, because their optical properties can change when their local chemical environment or their aggregation/interaction state changes." },
  { key: "E", title: "Optical Signal", category: "physical", text: "The chemical interaction changes how the sample absorbs or scatters light. That appears as a colour or intensity change that can be photographed." },
  { key: "F", title: "Photograph & Image Analysis", category: "digital", text: "A photo of the response is analysed: the reaction region is selected, the background is ignored and RGB values become one normalized optical feature." },
  { key: "G", title: "ESP32 (future hardware)", category: "simulated", text: "A dedicated optical sensor and ESP32 would automate acquisition and communication. It does not perform the chemistry and is not connected today." },
  { key: "H", title: "Calibration", category: "digital", text: "An optical feature alone is not a concentration. Reference samples of known concentration must be measured to build the calibration curve." },
  { key: "I", title: "Digital Result", category: "digital", text: "With a calibration model, the unknown's feature gives an estimated concentration. Without one, the app reports qualitative detection only." },
];

/* ------------------------------------------------------------------ */
/* Judge mode                                                          */
/* ------------------------------------------------------------------ */

export const JUDGE_SECONDS = 16;

/** `category` is omitted on context slides (problem, impact), which are neither lab work nor simulation. */
export const JUDGE: { id: string; title: string; lead: string; points: string[]; category?: Category }[] = [
  {
    id: "problem",
    title: "The problem",
    lead: "Adulterated milk is hard to spot, and lab confirmation is slow.",
    points: ["Laboratory results typically take 24–72 hours", "Screening needs to happen where milk is collected", "Results should be digital and traceable"],
  },
  {
    id: "physical",
    title: "Physical test",
    lead: "We perform the chemical screening test live.",
    points: ["Control, reference positive and unknown sample", "A visible analytical response appears", "This part is real, not simulated"],
    category: "physical",
  },
  {
    id: "nano",
    title: "Nano-sensing principle",
    lead: "A target-specific interaction changes the nano-sensing layer's optical response.",
    points: ["Target-specific interaction", "Nano-sensing response", "Observable optical signal"],
    category: "concept",
  },
  {
    id: "optical",
    title: "Photograph",
    lead: "The visible response is photographed: our experimental input.",
    points: ["Control, reference and unknown in one frame", "White reference area for lighting", "Controlled imaging reduces error"],
    category: "physical",
  },
  {
    id: "digital",
    title: "Image digitalization",
    lead: "The reaction region becomes numbers.",
    points: ["ROI selection, background ignored", "RGB extraction, glare excluded", "One normalized optical feature"],
    category: "digital",
  },
  {
    id: "calibration",
    title: "Calibration",
    lead: "Known reference samples connect the optical feature to concentration.",
    points: ["Reference standards, with replicates", "Fitted model with residuals", "No calibration, no concentration"],
    category: "digital",
  },
  {
    id: "result",
    title: "Result",
    lead: "Qualitative detection first; quantitative only with calibration.",
    points: ["A: physical response detected", "B: optical feature extracted", "C: concentration from calibration model"],
    category: "digital",
  },
  {
    id: "esp32",
    title: "Future hardware",
    lead: "An optical sensor and ESP32 would automate the measurement.",
    points: ["Optical sensor → electrical signal", "ESP32 ADC → digital value", "Simulated: not connected today"],
    category: "simulated",
  },
  {
    id: "impact",
    title: "Where we stand",
    lead: "The complete pathway from chemical response to digital analysis.",
    points: ["Physical chemistry demonstrated", "Image digitalization demonstrated", "Calibration data needed for quantitative use"],
  },
];

/* ------------------------------------------------------------------ */
/* Final judge screen                                                  */
/* ------------------------------------------------------------------ */

export const FINAL_STATEMENT =
  "Our prototype demonstrates the complete pathway from physical chemical response to digital analysis. Quantitative performance requires experimentally generated calibration and validation data.";

/* ------------------------------------------------------------------ */
/* Technology stack                                                    */
/* ------------------------------------------------------------------ */

export const TECH = [
  { layer: "Chemistry", what: "Nano-enabled sensing", category: "physical" as Category },
  { layer: "Imaging", what: "Photograph → ROI → optical feature", category: "digital" as Category },
  { layer: "Hardware", what: "Optical sensor + ESP32 (future)", category: "simulated" as Category },
  { layer: "Software", what: "Calibration + dashboard + report", category: "digital" as Category },
];

/* ------------------------------------------------------------------ */
/* Glossary (tooltips)                                                 */
/* ------------------------------------------------------------------ */

export const GLOSSARY = {
  analyte: "The substance the test is looking for. Here: urea.",
  nanoparticle: "A particle roughly 1–100 nanometres across. At this size, optical properties can depend strongly on the particle's surroundings.",
  colorimetric: "A method where the result is read as a colour change.",
  control: "A sample known not to contain the target. It shows what 'no response' looks like.",
  reference: "A sample known to contain the target. It confirms the assay is working.",
  roi: "Region of interest: the part of the photo that contains the reaction. Everything outside it is ignored.",
  whiteref: "A white area in the same photo. Dividing by it corrects for the brightness and colour of the lighting.",
  feature: "One number derived from the ROI colour. It is not a concentration until a calibration curve links the two.",
  au: "Absorbance units. Absorbance A = −log₁₀(I / I₀): how much light the sample absorbs compared with a blank.",
  transmittance: "The fraction of light that passes through the sample (I / I₀).",
  photodiode: "A light sensor that produces a current or voltage proportional to the light falling on it.",
  adc: "Analog-to-digital converter. Turns a voltage into a whole number. A 12-bit ADC gives 0–4095.",
  esp32: "A low-cost microcontroller with a built-in ADC, Wi-Fi and Bluetooth.",
  snr: "Signal-to-noise ratio: the signal level divided by the random fluctuation around it.",
  baseline: "The reading with no light (dark offset). Subtracting it removes the sensor's own offset.",
  normalisation: "Dividing by the blank reading so the result does not depend on lamp brightness.",
  calibration: "The measured relationship between known concentrations and the signal they produce.",
  regression: "Fitting a line through calibration points to describe the relationship.",
  r2: "Coefficient of determination: how closely the points follow the fitted line (1 = perfectly).",
  residual: "Measured value minus the value predicted by the fitted line. Patterns in residuals reveal a poor model.",
  syx: "Residual standard deviation (s_y/x): the typical scatter of points around the fitted line.",
  replicate: "A repeat measurement of the same reference level. Replicates show how repeatable the measurement is.",
} as const;

export type GlossaryKey = keyof typeof GLOSSARY;

/** Figure cited in the team's SIH deck, shown on the Judge Mode problem slide. */
export const PROBLEM_STAT = {
  value: "40,023 of 2,23,808",
  label: "food samples found non-conforming",
  source: "FSSAI enforcement data, FY 2025–26 (as cited in our SIH deck)",
};
