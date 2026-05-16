import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { HardwareMetadata } from "../types/hardware";

/**
 * Entidad TypeORM que mapea la tabla `hardware_components`.
 *
 * La estrategia de metadatos usa JSONB para flexibilidad:
 *   - No requiere ALTER TABLE para agregar nuevos atributos de hardware
 *   - PostgreSQL indexa campos JSONB individuales (ver migration)
 *   - La validación de forma corre en la capa de TypeScript (HardwareMetadata)
 *
 * Decisión de arquitectura: los queries de negocio (pc-builder route)
 * usan el pool de pg directamente para máxima performance. Esta entidad
 * sirve como fuente de verdad del esquema + habilita MedusaJS DI si se necesita.
 */
@Entity("hardware_components")
export class HardwareComponent extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255, unique: true })
  name: string;

  @Index("idx_hardware_category")
  @Column({ type: "varchar", length: 100 })
  category: string;

  /**
   * JSONB: almacena socket_type, form_factor, tdp_watts,
   * ram_generation, wattage_watts — cualquier subconjunto.
   * Índices parciales en la migration apuntan a los campos más usados.
   */
  @Column({ type: "jsonb", default: "{}" })
  metadata: HardwareMetadata;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updated_at: Date;
}
