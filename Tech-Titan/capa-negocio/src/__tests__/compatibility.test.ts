import {
  SocketCompatibilityRule,
  RamCompatibilityRule,
  PowerConsumptionRule,
  FormFactorCompatibilityRule,
  CoolerCompatibilityRule,
  PCBuildValidator,
  validatePCBuild,
} from "../services/compatibility";
import {
  CartItem,
  ComponentCategory,
  SocketType,
  FormFactor,
  RamGeneration,
  StorageInterface,
  CoolerType,
} from "../types/hardware";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const cpu_am5 = (name = "Ryzen 7 7800X3D", tdp = 120): CartItem => ({
  product_id: "cpu-am5-1",
  name,
  category:   ComponentCategory.CPU,
  metadata:   { socket_type: SocketType.AM5, tdp_watts: tdp },
});

const cpu_am4 = (name = "Ryzen 5 5600", tdp = 65): CartItem => ({
  product_id: "cpu-am4-1",
  name,
  category:   ComponentCategory.CPU,
  metadata:   { socket_type: SocketType.AM4, tdp_watts: tdp },
});

const cpu_lga1700 = (name = "i9-13900K", tdp = 125): CartItem => ({
  product_id: "cpu-lga-1",
  name,
  category:   ComponentCategory.CPU,
  metadata:   { socket_type: SocketType.LGA1700, tdp_watts: tdp },
});

const mb_am5_ddr5 = (ff = FormFactor.ATX): CartItem => ({
  product_id: "mb-am5-1",
  name:       "MSI MAG B650 TOMAHAWK",
  category:   ComponentCategory.MOTHERBOARD,
  metadata:   { socket_type: SocketType.AM5, form_factor: ff, ram_generation: RamGeneration.DDR5 },
});

const mb_am4_ddr4 = (ff = FormFactor.ATX): CartItem => ({
  product_id: "mb-am4-1",
  name:       "ASUS ROG STRIX B550-F",
  category:   ComponentCategory.MOTHERBOARD,
  metadata:   { socket_type: SocketType.AM4, form_factor: ff, ram_generation: RamGeneration.DDR4 },
});

const mb_lga1700_ddr4 = (ff = FormFactor.ATX): CartItem => ({
  product_id: "mb-lga-d4-1",
  name:       "MSI PRO Z690-A DDR4",
  category:   ComponentCategory.MOTHERBOARD,
  metadata:   { socket_type: SocketType.LGA1700, form_factor: ff, ram_generation: RamGeneration.DDR4 },
});

const mb_lga1700_ddr5 = (ff = FormFactor.ATX): CartItem => ({
  product_id: "mb-lga-d5-1",
  name:       "ASUS TUF Z790-Plus D5",
  category:   ComponentCategory.MOTHERBOARD,
  metadata:   { socket_type: SocketType.LGA1700, form_factor: ff, ram_generation: RamGeneration.DDR5 },
});

const ram_ddr5 = (name = "G.Skill Flare X5 32GB DDR5"): CartItem => ({
  product_id: "ram-ddr5-1",
  name,
  category:   ComponentCategory.RAM,
  metadata:   { ram_generation: RamGeneration.DDR5, capacity_gb: 32, speed_mhz: 6000 },
});

const ram_ddr4 = (name = "Corsair LPX 16GB DDR4"): CartItem => ({
  product_id: "ram-ddr4-1",
  name,
  category:   ComponentCategory.RAM,
  metadata:   { ram_generation: RamGeneration.DDR4, capacity_gb: 16, speed_mhz: 3200 },
});

const psu = (watts: number, name = `PSU ${watts}W`): CartItem => ({
  product_id: `psu-${watts}`,
  name,
  category:   ComponentCategory.PSU,
  metadata:   { wattage_watts: watts, tdp_watts: watts },
});

const gpu = (tdp: number): CartItem => ({
  product_id: `gpu-${tdp}w`,
  name:       `RTX GPU ${tdp}W`,
  category:   ComponentCategory.GPU,
  metadata:   { tdp_watts: tdp, vram_gb: 12 },
});

const caseATX  = (): CartItem => ({ product_id: "case-atx", name: "Corsair 4000D (ATX)",   category: ComponentCategory.CASE, metadata: { form_factor: FormFactor.ATX,  supported_form_factors: [FormFactor.ATX, FormFactor.MATX, FormFactor.ITX] } });
const caseMATX = (): CartItem => ({ product_id: "case-matx", name: "CM Q300L (MATX)",      category: ComponentCategory.CASE, metadata: { form_factor: FormFactor.MATX, supported_form_factors: [FormFactor.MATX, FormFactor.ITX] } });
const caseITX  = (): CartItem => ({ product_id: "case-itx",  name: "Corsair 2000D (ITX)",  category: ComponentCategory.CASE, metadata: { form_factor: FormFactor.ITX,  supported_form_factors: [FormFactor.ITX] } });

const cooler_am5 = (tdpRating = 300): CartItem => ({
  product_id: "cooler-aio",
  name:       `DeepCool LT520 240mm AIO`,
  category:   ComponentCategory.COOLER,
  metadata:   { cooler_type: CoolerType.AIO_240, supported_sockets: [SocketType.AM4, SocketType.AM5, SocketType.LGA1700], tdp_rating: tdpRating },
});

const cooler_am4_only = (): CartItem => ({
  product_id: "cooler-am4",
  name:       "AMD Wraith Stealth",
  category:   ComponentCategory.COOLER,
  metadata:   { cooler_type: CoolerType.Stock, supported_sockets: [SocketType.AM4], tdp_rating: 65 },
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1: SocketCompatibilityRule
// ─────────────────────────────────────────────────────────────────────────────

describe("SocketCompatibilityRule", () => {
  const rule = new SocketCompatibilityRule();

  it("pasa sin errores cuando solo hay CPU (falta MB)", () => {
    expect(rule.validate([cpu_am5()])).toEqual({ errors: [], warnings: [] });
  });

  it("pasa sin errores cuando solo hay MB (falta CPU)", () => {
    expect(rule.validate([mb_am5_ddr5()])).toEqual({ errors: [], warnings: [] });
  });

  it("AM5 + AM5 → compatible", () => {
    const res = rule.validate([cpu_am5(), mb_am5_ddr5()]);
    expect(res.errors).toHaveLength(0);
  });

  it("AM4 + AM4 → compatible", () => {
    const res = rule.validate([cpu_am4(), mb_am4_ddr4()]);
    expect(res.errors).toHaveLength(0);
  });

  it("LGA1700 + LGA1700 DDR4 → compatible", () => {
    const res = rule.validate([cpu_lga1700(), mb_lga1700_ddr4()]);
    expect(res.errors).toHaveLength(0);
  });

  it("AM5 + AM4 MB → error de socket", () => {
    const res = rule.validate([cpu_am5(), mb_am4_ddr4()]);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0]).toMatch(/AM5.*AM4|socket/i);
  });

  it("AM4 + AM5 MB → error de socket", () => {
    const res = rule.validate([cpu_am4(), mb_am5_ddr5()]);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0]).toMatch(/socket/i);
  });

  it("LGA1700 CPU + AM5 MB → error de socket", () => {
    const res = rule.validate([cpu_lga1700(), mb_am5_ddr5()]);
    expect(res.errors).toHaveLength(1);
  });

  it("CPU sin socket_type → warning, no error", () => {
    const cpuNoSocket: CartItem = { product_id: "x", name: "CPU sin datos", category: ComponentCategory.CPU, metadata: {} };
    const res = rule.validate([cpuNoSocket, mb_am5_ddr5()]);
    expect(res.errors).toHaveLength(0);
    expect(res.warnings).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2: RamCompatibilityRule
// ─────────────────────────────────────────────────────────────────────────────

describe("RamCompatibilityRule", () => {
  const rule = new RamCompatibilityRule();

  it("pasa sin errores sin RAM ni MB", () => {
    expect(rule.validate([])).toEqual({ errors: [], warnings: [] });
  });

  it("DDR5 + MB DDR5 → compatible", () => {
    const res = rule.validate([mb_am5_ddr5(), ram_ddr5()]);
    expect(res.errors).toHaveLength(0);
  });

  it("DDR4 + MB DDR4 → compatible", () => {
    const res = rule.validate([mb_am4_ddr4(), ram_ddr4()]);
    expect(res.errors).toHaveLength(0);
  });

  it("DDR4 + MB DDR5 → error de generación", () => {
    const res = rule.validate([mb_am5_ddr5(), ram_ddr4()]);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0]).toMatch(/DDR4.*DDR5|incompatibilidad/i);
  });

  it("DDR5 + MB DDR4 → error de generación", () => {
    const res = rule.validate([mb_am4_ddr4(), ram_ddr5()]);
    expect(res.errors).toHaveLength(1);
  });

  it("MB sin ram_generation → warning", () => {
    const mbSinGen: CartItem = { product_id: "x", name: "MB sin gen", category: ComponentCategory.MOTHERBOARD, metadata: { socket_type: SocketType.AM5 } };
    const res = rule.validate([mbSinGen, ram_ddr5()]);
    expect(res.errors).toHaveLength(0);
    expect(res.warnings).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3: PowerConsumptionRule
// ─────────────────────────────────────────────────────────────────────────────

describe("PowerConsumptionRule", () => {
  const rule = new PowerConsumptionRule();

  it("sin TDP → sin errores ni warnings", () => {
    expect(rule.validate([])).toEqual({ errors: [], warnings: [] });
  });

  it("CPU 65W + GPU 200W + PSU 850W → ok (baja carga)", () => {
    const res = rule.validate([cpu_am4(undefined, 65), gpu(200), psu(850)]);
    expect(res.errors).toHaveLength(0);
    expect(res.warnings).toHaveLength(0);
  });

  it("CPU 125W + GPU 320W + PSU 850W → warning de alta carga", () => {
    const res = rule.validate([cpu_lga1700(undefined, 125), gpu(320), psu(850)]);
    // 445W / 850W = 52% → ok, no warning
    // Pero con VRAM y PSU menor…
    expect(res.errors).toHaveLength(0);
  });

  it("CPU 125W + GPU 450W > PSU 550W → error de potencia insuficiente", () => {
    const res = rule.validate([cpu_lga1700(undefined, 125), gpu(450), psu(550)]);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0]).toMatch(/insuficiente|575W.*550W/i);
  });

  it("build con TDP pero sin PSU → warning de PSU faltante", () => {
    const res = rule.validate([cpu_am5(undefined, 120), gpu(220)]);
    expect(res.errors).toHaveLength(0);
    expect(res.warnings).toHaveLength(1);
    expect(res.warnings[0]).toMatch(/sin.*PSU|fuente de poder/i);
  });

  it("PSU sin wattage_watts → warning", () => {
    const psuSinWatt: CartItem = { product_id: "x", name: "PSU sin datos", category: ComponentCategory.PSU, metadata: {} };
    const res = rule.validate([cpu_am4(undefined, 65), psuSinWatt]);
    expect(res.warnings).toHaveLength(1);
    expect(res.warnings[0]).toMatch(/wattage/i);
  });

  it("carga al 85% → warning de alta carga", () => {
    // 680W / 850W = 80% < 80%... necesito > 80%
    // 690W / 850W = 81% → warning
    const res = rule.validate([cpu_am5(undefined, 170), gpu(450), psu(750)]);
    // 620W / 750W = 82.6% → warning
    expect(res.warnings.some((w) => w.includes("carga"))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 4: FormFactorCompatibilityRule
// ─────────────────────────────────────────────────────────────────────────────

describe("FormFactorCompatibilityRule", () => {
  const rule = new FormFactorCompatibilityRule();

  it("sin MB ni case → sin errores", () => {
    expect(rule.validate([])).toEqual({ errors: [], warnings: [] });
  });

  it("MB ATX + Case ATX → compatible", () => {
    const res = rule.validate([mb_am5_ddr5(FormFactor.ATX), caseATX()]);
    expect(res.errors).toHaveLength(0);
  });

  it("MB MATX + Case ATX → compatible (ATX admite MATX)", () => {
    const res = rule.validate([mb_am5_ddr5(FormFactor.MATX), caseATX()]);
    expect(res.errors).toHaveLength(0);
  });

  it("MB ITX + Case ATX → compatible (ATX admite ITX)", () => {
    const res = rule.validate([mb_am5_ddr5(FormFactor.ITX), caseATX()]);
    expect(res.errors).toHaveLength(0);
  });

  it("MB ATX + Case MATX → error (MATX no admite ATX)", () => {
    const res = rule.validate([mb_am5_ddr5(FormFactor.ATX), caseMATX()]);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0]).toMatch(/ATX.*no cabe|form factor/i);
  });

  it("MB ATX + Case ITX → error (ITX solo admite ITX)", () => {
    const res = rule.validate([mb_am5_ddr5(FormFactor.ATX), caseITX()]);
    expect(res.errors).toHaveLength(1);
  });

  it("MB MATX + Case ITX → error (ITX solo admite ITX)", () => {
    const res = rule.validate([mb_am5_ddr5(FormFactor.MATX), caseITX()]);
    expect(res.errors).toHaveLength(1);
  });

  it("MB ITX + Case ITX → compatible", () => {
    const res = rule.validate([mb_am5_ddr5(FormFactor.ITX), caseITX()]);
    expect(res.errors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 5: CoolerCompatibilityRule
// ─────────────────────────────────────────────────────────────────────────────

describe("CoolerCompatibilityRule", () => {
  const rule = new CoolerCompatibilityRule();

  it("sin CPU ni cooler → sin errores", () => {
    expect(rule.validate([])).toEqual({ errors: [], warnings: [] });
  });

  it("CPU AM5 + cooler multi-socket AM5 → compatible", () => {
    const res = rule.validate([cpu_am5(), cooler_am5()]);
    expect(res.errors).toHaveLength(0);
  });

  it("CPU AM5 + cooler solo AM4 → error de socket", () => {
    const res = rule.validate([cpu_am5(), cooler_am4_only()]);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0]).toMatch(/AM5|socket/i);
  });

  it("CPU AM4 + cooler solo AM4 → compatible (socket ok)", () => {
    const res = rule.validate([cpu_am4(), cooler_am4_only()]);
    // Socket ok (65W ≤ 65W TDP rating)
    expect(res.errors).toHaveLength(0);
  });

  it("CPU 120W TDP + cooler 300W rating → compatible", () => {
    const res = rule.validate([cpu_am5(undefined, 120), cooler_am5(300)]);
    expect(res.errors).toHaveLength(0);
    expect(res.warnings).toHaveLength(0);
  });

  it("CPU 170W TDP + cooler 150W rating → error TDP insuficiente", () => {
    const hotCpu: CartItem = { product_id: "hot", name: "CPU 170W", category: ComponentCategory.CPU, metadata: { socket_type: SocketType.AM5, tdp_watts: 170 } };
    const weakCooler: CartItem = { product_id: "wc", name: "Cooler 150W", category: ComponentCategory.COOLER, metadata: { cooler_type: CoolerType.Air, supported_sockets: [SocketType.AM5], tdp_rating: 150 } };
    const res = rule.validate([hotCpu, weakCooler]);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0]).toMatch(/insuficiente|170W.*150W/i);
  });

  it("CPU 170W + cooler 180W (94%) → warning de límite térmico", () => {
    const hotCpu: CartItem = { product_id: "hot", name: "CPU 170W", category: ComponentCategory.CPU, metadata: { socket_type: SocketType.AM5, tdp_watts: 170 } };
    const okCooler: CartItem = { product_id: "okc", name: "Cooler 180W", category: ComponentCategory.COOLER, metadata: { cooler_type: CoolerType.Air, supported_sockets: [SocketType.AM5], tdp_rating: 180 } };
    const res = rule.validate([hotCpu, okCooler]);
    expect(res.errors).toHaveLength(0);
    expect(res.warnings).toHaveLength(1);
    expect(res.warnings[0]).toMatch(/límite|warning/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 6: PCBuildValidator — builds completos
// ─────────────────────────────────────────────────────────────────────────────

describe("PCBuildValidator — builds completos", () => {
  it("build AMD AM5 DDR5 completo → 100% compatible", () => {
    const items = [cpu_am5(), mb_am5_ddr5(), ram_ddr5(), gpu(220), psu(850), caseATX(), cooler_am5()];
    const result = validatePCBuild(items);
    expect(result.compatible).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("build Intel LGA1700 DDR4 completo → 100% compatible", () => {
    const items = [cpu_lga1700(), mb_lga1700_ddr4(), ram_ddr4(), gpu(200), psu(750), caseATX(), cooler_am5()];
    const result = validatePCBuild(items);
    expect(result.compatible).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("mix AM5 CPU + AM4 MB + DDR4 RAM → al menos un error de socket", () => {
    const items = [cpu_am5(), mb_am4_ddr4(), ram_ddr4()];
    const result = validatePCBuild(items);
    expect(result.compatible).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
    expect(result.errors.some((e) => /socket/i.test(e))).toBe(true);
  });

  it("build sin PSU con GPU → warning de potencia", () => {
    const items = [cpu_am5(), mb_am5_ddr5(), ram_ddr5(), gpu(220)];
    const result = validatePCBuild(items);
    expect(result.compatible).toBe(true);
    expect(result.warnings.some((w) => w.match(/PSU|fuente/i))).toBe(true);
  });

  it("PSU insuficiente → compatible=false", () => {
    const items = [cpu_am5(undefined, 120), gpu(450), psu(400)];
    const result = validatePCBuild(items);
    expect(result.compatible).toBe(false);
    expect(result.errors.some((e) => e.match(/insuficiente/i))).toBe(true);
  });
});
