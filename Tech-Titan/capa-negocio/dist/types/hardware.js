"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SocketType = exports.RamGeneration = exports.FormFactor = exports.ComponentCategory = void 0;
let SocketType = exports.SocketType = /*#__PURE__*/function (SocketType) {
  SocketType["AM4"] = "AM4";
  SocketType["AM5"] = "AM5";
  SocketType["LGA1700"] = "LGA1700";
  SocketType["LGA1200"] = "LGA1200";
  return SocketType;
}({});
let FormFactor = exports.FormFactor = /*#__PURE__*/function (FormFactor) {
  FormFactor["ATX"] = "ATX";
  FormFactor["MATX"] = "MATX";
  FormFactor["ITX"] = "ITX";
  return FormFactor;
}({});
let RamGeneration = exports.RamGeneration = /*#__PURE__*/function (RamGeneration) {
  RamGeneration["DDR4"] = "DDR4";
  RamGeneration["DDR5"] = "DDR5";
  return RamGeneration;
}({});
let ComponentCategory = exports.ComponentCategory = /*#__PURE__*/function (ComponentCategory) {
  ComponentCategory["CPU"] = "CPU";
  ComponentCategory["MOTHERBOARD"] = "Motherboard";
  ComponentCategory["RAM"] = "RAM";
  ComponentCategory["GPU"] = "GPU";
  ComponentCategory["PSU"] = "PSU";
  ComponentCategory["STORAGE"] = "Storage";
  return ComponentCategory;
}({});