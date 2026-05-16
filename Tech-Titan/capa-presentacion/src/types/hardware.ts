export enum SocketType {
  AM4 = "AM4",
  AM5 = "AM5",
  LGA1700 = "LGA1700",
  LGA1200 = "LGA1200",
}

export enum FormFactor {
  ATX = "ATX",
  MATX = "MATX",
  ITX = "ITX",
}

export enum RamGeneration {
  DDR4 = "DDR4",
  DDR5 = "DDR5",
}

export enum ComponentCategory {
  CPU         = "CPU",
  MOTHERBOARD = "Motherboard",
  RAM         = "RAM",
  GPU         = "GPU",
  PSU         = "PSU",
  STORAGE     = "Storage",
}

export interface HardwareMetadata {
  socket_type?:    SocketType;
  form_factor?:    FormFactor;
  tdp_watts?:      number;
  ram_generation?: RamGeneration;
  wattage_watts?:  number;
}

export interface HardwareProduct {
  id:       string;
  name:     string;
  category: ComponentCategory;
  metadata: HardwareMetadata;
  price?:   number;
}

export interface ValidationResult {
  compatible: boolean;
  errors:     string[];
  warnings:   string[];
}
