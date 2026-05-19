import {
  CartItem,
  ComponentCategory,
  ValidationResult,
  FormFactor,
} from "../types/hardware";

// ─── Strategy Interface ───────────────────────────────────────────────────────

export interface RuleOutcome {
  readonly errors:   string[];
  readonly warnings: string[];
}

export interface CompatibilityRule {
  readonly ruleName: string;
  validate(items: CartItem[]): RuleOutcome;
}

const EMPTY: RuleOutcome = Object.freeze({ errors: [], warnings: [] });

// ─── Rule 1: CPU ↔ Motherboard Socket ────────────────────────────────────────

export class SocketCompatibilityRule implements CompatibilityRule {
  readonly ruleName = "SocketCompatibility";

  validate(items: CartItem[]): RuleOutcome {
    const cpu = items.find((i) => i.category === ComponentCategory.CPU);
    const mb  = items.find((i) => i.category === ComponentCategory.MOTHERBOARD);
    if (!cpu || !mb) return EMPTY;

    const cpuSocket = cpu.metadata.socket_type;
    const mbSocket  = mb.metadata.socket_type;

    if (!cpuSocket || !mbSocket) {
      const missing = !cpuSocket ? cpu.name : mb.name;
      return { errors: [], warnings: [`No se pudo verificar socket: faltan datos en "${missing}".`] };
    }

    if (cpuSocket !== mbSocket) {
      return {
        errors: [`Incompatibilidad de Socket: "${cpu.name}" usa ${cpuSocket} pero "${mb.name}" requiere ${mbSocket}.`],
        warnings: [],
      };
    }
    return EMPTY;
  }
}

// ─── Rule 2: RAM Generation ↔ Motherboard ────────────────────────────────────

export class RamCompatibilityRule implements CompatibilityRule {
  readonly ruleName = "RamCompatibility";

  validate(items: CartItem[]): RuleOutcome {
    const rams = items.filter((i) => i.category === ComponentCategory.RAM);
    const mb   = items.find((i) => i.category === ComponentCategory.MOTHERBOARD);
    if (rams.length === 0 || !mb) return EMPTY;

    const mbRamGen = mb.metadata.ram_generation;
    if (!mbRamGen) {
      return { errors: [], warnings: [`"${mb.name}" no tiene generación de RAM definida.`] };
    }

    const errors: string[] = [];
    for (const ram of rams) {
      const ramGen = ram.metadata.ram_generation;
      if (!ramGen) {
        errors.push(`"${ram.name}" no tiene generación de RAM en sus metadatos.`);
        continue;
      }
      if (ramGen !== mbRamGen) {
        errors.push(`Incompatibilidad de RAM: "${ram.name}" es ${ramGen} pero "${mb.name}" soporta ${mbRamGen}.`);
      }
    }
    return { errors, warnings: [] };
  }
}

// ─── Rule 3: Consumo Energético ───────────────────────────────────────────────

const PSU_HIGH_LOAD = 0.8;

export class PowerConsumptionRule implements CompatibilityRule {
  readonly ruleName = "PowerConsumption";

  validate(items: CartItem[]): RuleOutcome {
    const psu      = items.find((i) => i.category === ComponentCategory.PSU);
    const totalTdp = items
      .filter((i) => i.category !== ComponentCategory.PSU)
      .reduce((acc, i) => acc + (i.metadata.tdp_watts ?? 0), 0);

    if (totalTdp === 0) return EMPTY;

    if (!psu) {
      return { errors: [], warnings: [`Consumo estimado de ${totalTdp}W detectado pero no hay Fuente de Poder en el build.`] };
    }

    const psuWattage = psu.metadata.wattage_watts;
    if (!psuWattage) {
      return { errors: [], warnings: [`"${psu.name}" no tiene wattage definido.`] };
    }

    if (totalTdp > psuWattage) {
      return {
        errors: [`Potencia insuficiente: el sistema requiere ~${totalTdp}W pero "${psu.name}" solo entrega ${psuWattage}W.`],
        warnings: [],
      };
    }

    const pct = Math.round((totalTdp / psuWattage) * 100);
    if (totalTdp / psuWattage > PSU_HIGH_LOAD) {
      return {
        errors: [],
        warnings: [`Alta carga en PSU: el sistema consume ~${totalTdp}W (${pct}% de ${psuWattage}W). Considera una PSU de mayor capacidad.`],
      };
    }
    return EMPTY;
  }
}

// ─── Rule 4: Form Factor — Placa ↔ Gabinete ──────────────────────────────────
// ATX case → admite ATX, MATX, ITX
// MATX case → admite MATX, ITX  (no cabe ATX)
// ITX case  → admite solo ITX   (no caben ATX ni MATX)

export class FormFactorCompatibilityRule implements CompatibilityRule {
  readonly ruleName = "FormFactorCompatibility";

  validate(items: CartItem[]): RuleOutcome {
    const mb       = items.find((i) => i.category === ComponentCategory.MOTHERBOARD);
    const pcCase   = items.find((i) => i.category === ComponentCategory.CASE);
    if (!mb || !pcCase) return EMPTY;

    const mbFF              = mb.metadata.form_factor;
    const supportedFormFactors = pcCase.metadata.supported_form_factors;

    if (!mbFF) {
      return { errors: [], warnings: [`"${mb.name}" no tiene form factor definido.`] };
    }
    if (!supportedFormFactors || supportedFormFactors.length === 0) {
      return { errors: [], warnings: [`"${pcCase.name}" no tiene form factors soportados definidos.`] };
    }

    if (!supportedFormFactors.includes(mbFF)) {
      const listed = supportedFormFactors.join(", ");
      return {
        errors: [`Form Factor incompatible: "${mb.name}" (${mbFF}) no cabe en "${pcCase.name}" (soporta ${listed}).`],
        warnings: [],
      };
    }
    return EMPTY;
  }
}

// ─── Rule 5: Cooler — Socket + TDP Rating ────────────────────────────────────

const COOLER_TDP_WARNING_MARGIN = 0.9;

export class CoolerCompatibilityRule implements CompatibilityRule {
  readonly ruleName = "CoolerCompatibility";

  validate(items: CartItem[]): RuleOutcome {
    const cpu    = items.find((i) => i.category === ComponentCategory.CPU);
    const cooler = items.find((i) => i.category === ComponentCategory.COOLER);
    if (!cpu || !cooler) return EMPTY;

    const errors:   string[] = [];
    const warnings: string[] = [];

    const cpuSocket        = cpu.metadata.socket_type;
    const supportedSockets = cooler.metadata.supported_sockets;

    if (cpuSocket && supportedSockets && supportedSockets.length > 0) {
      if (!supportedSockets.includes(cpuSocket)) {
        const listed = supportedSockets.join(", ");
        return {
          errors: [`"${cooler.name}" no soporta el socket ${cpuSocket} (soporta: ${listed}).`],
          warnings: [],
        };
      }
    }

    const cpuTdp    = cpu.metadata.tdp_watts;
    const tdpRating = cooler.metadata.tdp_rating;

    if (cpuTdp && tdpRating) {
      if (cpuTdp > tdpRating) {
        errors.push(`Refrigeración insuficiente: "${cpu.name}" consume ${cpuTdp}W pero "${cooler.name}" solo maneja ${tdpRating}W TDP.`);
      } else if (cpuTdp / tdpRating > COOLER_TDP_WARNING_MARGIN) {
        warnings.push(`"${cooler.name}" está cerca de su límite térmico (${cpuTdp}W de ${tdpRating}W máx). Considera un cooler de mayor capacidad.`);
      }
    }

    return { errors, warnings };
  }
}

// ─── Orchestrator (Chain of Responsibility) ──────────────────────────────────

export class PCBuildValidator {
  private readonly rules: readonly CompatibilityRule[];

  constructor(rules: CompatibilityRule[]) {
    this.rules = rules;
  }

  validate(items: CartItem[]): ValidationResult {
    const errors:   string[] = [];
    const warnings: string[] = [];

    for (const rule of this.rules) {
      const outcome = rule.validate(items);
      errors.push(...outcome.errors);
      warnings.push(...outcome.warnings);
    }

    return { compatible: errors.length === 0, errors, warnings };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

const defaultValidator = new PCBuildValidator([
  new SocketCompatibilityRule(),
  new RamCompatibilityRule(),
  new PowerConsumptionRule(),
  new FormFactorCompatibilityRule(),
  new CoolerCompatibilityRule(),
]);

export function validatePCBuild(items: CartItem[]): ValidationResult {
  return defaultValidator.validate(items);
}
