import type { HardwareMetadata } from "../types/hardware";

export class HardwareComponent {
  id!:         string;
  name!:       string;
  category!:   string;
  metadata!:   HardwareMetadata;
  created_at!: Date;
  updated_at!: Date;
}
