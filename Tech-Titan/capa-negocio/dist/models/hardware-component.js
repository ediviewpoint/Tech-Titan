"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HardwareComponent = void 0;
var _typeorm = require("typeorm");
var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6;
function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
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
let HardwareComponent = exports.HardwareComponent = (_dec = (0, _typeorm.Entity)("hardware_components"), _dec2 = (0, _typeorm.PrimaryGeneratedColumn)("uuid"), _dec3 = (0, _typeorm.Column)({
  type: "varchar",
  length: 255,
  unique: true
}), _dec4 = (0, _typeorm.Index)("idx_hardware_category"), _dec5 = (0, _typeorm.Column)({
  type: "varchar",
  length: 100
}), _dec6 = (0, _typeorm.Column)({
  type: "jsonb",
  default: "{}"
}), _dec7 = (0, _typeorm.CreateDateColumn)({
  name: "created_at",
  type: "timestamptz"
}), _dec8 = (0, _typeorm.UpdateDateColumn)({
  name: "updated_at",
  type: "timestamptz"
}), _dec(_class = (_class2 = class HardwareComponent extends _typeorm.BaseEntity {
  constructor(...args) {
    super(...args);
    _initializerDefineProperty(this, "id", _descriptor, this);
    _initializerDefineProperty(this, "name", _descriptor2, this);
    _initializerDefineProperty(this, "category", _descriptor3, this);
    /**
     * JSONB: almacena socket_type, form_factor, tdp_watts,
     * ram_generation, wattage_watts — cualquier subconjunto.
     * Índices parciales en la migration apuntan a los campos más usados.
     */
    _initializerDefineProperty(this, "metadata", _descriptor4, this);
    _initializerDefineProperty(this, "created_at", _descriptor5, this);
    _initializerDefineProperty(this, "updated_at", _descriptor6, this);
  }
}, _descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
}), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "name", [_dec3], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
}), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "category", [_dec4, _dec5], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
}), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "metadata", [_dec6], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
}), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "created_at", [_dec7], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
}), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "updated_at", [_dec8], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
}), _class2)) || _class);