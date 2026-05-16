/*
 * ============================================================
 * CAPA DE NEGOCIO — CompatibilityService
 * ============================================================
 *
 * POR QUE ESTA LOGICA VIVE AQUI Y NO EN EL FRONTEND:
 *
 * 1. REGLA DE NEGOCIO, NO LOGICA DE PRESENTACION
 *    Determinar si un AM5 encaja en una placa AM4 es una verdad
 *    del dominio "hardware PC". El frontend solo debe *mostrar*
 *    el resultado, nunca calcularlo. Si la UI decide la
 *    compatibilidad, cualquier cliente alternativo (mobile,
 *    bot, integrador B2B) podria saltarse la validacion.
 *
 * 2. FUENTE UNICA DE VERDAD
 *    Al centralizar las reglas aqui, todos los clientes
 *    consumen la misma logica via la API. Un cambio de regla
 *    (ej: agregar verificacion PCIe Gen5) se propaga a todos
 *    de forma inmediata, sin despliegues de frontend.
 *
 * 3. TESTABILIDAD PURA
 *    Las funciones de validacion son puras: reciben datos y
 *    devuelven resultados sin efectos secundarios. Se pueden
 *    cubrir al 100% con unit tests sin base de datos ni HTTP.
 *
 * ============================================================
 * PATRON DE DISENO APLICADO: Strategy + Chain of Responsibility
 * ============================================================
 *
 * Strategy Pattern:
 *   - Interfaz comun: CompatibilityRule
 *   - Algoritmos intercambiables: SocketCompatibilityRule,
 *     RamCompatibilityRule, PowerConsumptionRule
 *   - Permite agregar nuevas reglas (PCIe, Thermal, Form Factor)
 *     sin modificar codigo existente (Principio Open/Closed).
 *
 * Chain of Responsibility:
 *   - PCBuildValidator itera las reglas en secuencia.
 *   - Cada regla contribuye errores/advertencias independientes.
 *   - Una regla fallida no detiene la cadena: el usuario recibe
 *     TODOS los problemas de una vez, no uno por vez.
 */

import { CartItem, ComponentCategory, ValidationResult } from "../types/hardware";

// ─── Strategy Interface ───────────────────────────────────────────────────────

export interface RuleOutcome {
  readonly errors: string[];
  readonly warnings: string[];
}

export interface CompatibilityRule {
  readonly ruleName: string;
  validate(items: CartItem[]): RuleOutcome;
}

const EMPTY: RuleOutcome = Object.freeze({ errors: [], warnings: [] });

// ─── Concrete Strategy 1: CPU ↔ Motherboard Socket ───────────────────────────

export class SocketCompatibilityRule implements CompatibilityRule {
  readonly ruleName = "SocketCompatibility";

  validate(items: CartItem[]): RuleOutcome {
    const cpu = items.find((i) => i.category === ComponentCategory.CPU);
    const mb = items.find((i) => i.category === ComponentCategory.MOTHERBOARD);

    if (!cpu || !mb) return EMPTY;

    const cpuSocket = cpu.metadata.socket_type;
    const mbSocket = mb.metadata.socket_type;

    if (!cpuSocket || !mbSocket) {
      const missing = !cpuSocket ? cpu.name : mb.name;
      return {
        errors: [],
        warnings: [
          `No se pudo verificar compatibilidad de socket: faltan datos en "${missing}".`,
        ],
      };
    }

    if (cpuSocket !== mbSocket) {
      return {
        errors: [
          `Incompatibilidad de Socket: "${cpu.name}" usa ${cpuSocket} pero "${mb.name}" requiere ${mbSocket}.`,
        ],
        warnings: [],
      };
    }

    return EMPTY;
  }
}

// ─── Concrete Strategy 2: RAM Generation ↔ Motherboard ──────────────────────

export class RamCompatibilityRule implements CompatibilityRule {
  readonly ruleName = "RamCompatibility";

  validate(items: CartItem[]): RuleOutcome {
    const rams = items.filter((i) => i.category === ComponentCategory.RAM);
    const mb = items.find((i) => i.category === ComponentCategory.MOTHERBOARD);

    if (rams.length === 0 || !mb) return EMPTY;

    const mbRamGen = mb.metadata.ram_generation;

    if (!mbRamGen) {
      return {
        errors: [],
        warnings: [
          `"${mb.name}" no tiene generacion de RAM definida en sus metadatos. Actualiza el seed con ram_generation para habilitar esta validacion.`,
        ],
      };
    }

    const errors: string[] = [];

    for (const ram of rams) {
      const ramGen = ram.metadata.ram_generation;

      if (!ramGen) {
        errors.push(
          `"${ram.name}" no tiene generacion de RAM en sus metadatos.`
        );
        continue;
      }

      if (ramGen !== mbRamGen) {
        errors.push(
          `Incompatibilidad de RAM: "${ram.name}" es ${ramGen} pero "${mb.name}" soporta ${mbRamGen}.`
        );
      }
    }

    return { errors, warnings: [] };
  }
}

// ─── Concrete Strategy 3: Power Consumption ──────────────────────────────────

const PSU_HIGH_LOAD_THRESHOLD = 0.8;

export class PowerConsumptionRule implements CompatibilityRule {
  readonly ruleName = "PowerConsumption";

  validate(items: CartItem[]): RuleOutcome {
    const psu = items.find((i) => i.category === ComponentCategory.PSU);
    const totalTdp = items.reduce(
      (acc, item) => acc + (item.metadata.tdp_watts ?? 0),
      0
    );

    if (totalTdp === 0) return EMPTY;

    if (!psu) {
      return {
        errors: [],
        warnings: [
          `Consumo estimado de ${totalTdp}W detectado pero no hay Fuente de Poder (PSU) en el carrito.`,
        ],
      };
    }

    const psuWattage = psu.metadata.wattage_watts;

    if (!psuWattage) {
      return {
        errors: [],
        warnings: [
          `"${psu.name}" no tiene wattage definido. Agrega wattage_watts a sus metadatos para verificar consumo.`,
        ],
      };
    }

    if (totalTdp > psuWattage) {
      return {
        errors: [
          `Potencia insuficiente: el sistema requiere ~${totalTdp}W pero "${psu.name}" solo entrega ${psuWattage}W.`,
        ],
        warnings: [],
      };
    }

    const loadPercent = Math.round((totalTdp / psuWattage) * 100);

    if (totalTdp / psuWattage > PSU_HIGH_LOAD_THRESHOLD) {
      return {
        errors: [],
        warnings: [
          `Alta carga en PSU: el sistema consume ~${totalTdp}W (${loadPercent}% de ${psuWattage}W). Se recomienda una PSU de mayor capacidad para garantizar estabilidad.`,
        ],
      };
    }

    return EMPTY;
  }
}

// ─── Orchestrator (Chain of Responsibility) ──────────────────────────────────

export class PCBuildValidator {
  private readonly rules: readonly CompatibilityRule[];

  constructor(rules: CompatibilityRule[]) {
    this.rules = rules;
  }

  validate(items: CartItem[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const rule of this.rules) {
      const outcome = rule.validate(items);
      errors.push(...outcome.errors);
      warnings.push(...outcome.warnings);
    }

    return {
      compatible: errors.length === 0,
      errors,
      warnings,
    };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

const defaultValidator = new PCBuildValidator([
  new SocketCompatibilityRule(),
  new RamCompatibilityRule(),
  new PowerConsumptionRule(),
]);

/**
 * Valida si los componentes dados forman un build de PC compatible.
 * Funcion pura: no accede a base de datos ni produce efectos secundarios.
 *
 * @param items - Lista de componentes del carrito con sus metadatos de hardware
 * @returns ValidationResult con compatible, errors[] y warnings[]
 */
export function validatePCBuild(items: CartItem[]): ValidationResult {
  return defaultValidator.validate(items);
}

// ─── MedusaJS Service Adapter ─────────────────────────────────────────────────
// MedusaJS auto-descubre y registra todo archivo en src/services/ que tenga
// un default export class. Esta clase actua como adaptador (Adapter Pattern)
// que expone la logica pura de validatePCBuild dentro del contenedor de DI
// de MedusaJS, sin acoplar la logica de negocio a su framework.

class CompatibilityService {
  // MedusaJS/awilix inyecta el container aqui; lo ignoramos porque este
  // servicio no tiene dependencias de infraestructura.
  constructor(_container: Record<string, unknown> = {}) {}

  validateBuild(items: CartItem[]): ValidationResult {
    return validatePCBuild(items);
  }
}

export default CompatibilityService;
