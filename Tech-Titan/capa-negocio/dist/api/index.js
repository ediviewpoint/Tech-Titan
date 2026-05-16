"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _express = require("express");
var _pcBuilder = _interopRequireDefault(require("./routes/pc-builder"));
var _userBuilds = _interopRequireDefault(require("./routes/user-builds"));
var _adminHardware = _interopRequireDefault(require("./routes/admin-hardware"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var _default = _rootDirectory => {
  const router = (0, _express.Router)();
  router.use((0, _express.json)());
  router.use("/store/pc-builder", _pcBuilder.default);
  router.use("/store/user-builds", _userBuilds.default);
  router.use("/store/admin/hardware", _adminHardware.default);
  return router;
};
exports.default = _default;