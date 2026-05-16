"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _pg = require("pg");
var dotenv = _interopRequireWildcard(require("dotenv"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
dotenv.config();
const pool = new _pg.Pool({
  connectionString: process.env.DB_URL ?? "postgres://postgres:postgres@localhost:5432/medusa_db",
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 3_000
});
var _default = exports.default = pool;