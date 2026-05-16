#!/usr/bin/env node
/**
 * Tech-Titan :: System Health Check (cross-platform)
 * Uso: node scripts/check-system.js  |  npm run status
 */
const net  = require("net");
const http = require("http");

const RESET  = "\x1b[0m";
const BOLD   = "\x1b[1m";
const CYAN   = "\x1b[36m";
const GREEN  = "\x1b[32m";
const RED    = "\x1b[31m";
const YELLOW = "\x1b[33m";
const DIM    = "\x1b[2m";

const ok   = (msg) => `${GREEN}${BOLD}  [OK]${RESET}  ${msg}`;
const fail = (msg) => `${RED}${BOLD}  [XX]${RESET}  ${msg}`;
const info = (msg) => `${DIM}         ${msg}${RESET}`;

function checkTCP(host, port, timeout = 3000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resolved = false;
    const done = (ok) => { if (!resolved) { resolved = true; socket.destroy(); resolve(ok); } };
    socket.setTimeout(timeout);
    socket.on("connect", () => done(true));
    socket.on("timeout", () => done(false));
    socket.on("error",   () => done(false));
    socket.connect(port, host);
  });
}

function checkHTTP(url, timeout = 4000) {
  return new Promise((resolve) => {
    try {
      const req = http.get(url, { timeout }, (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 400);
        res.resume();
      });
      req.on("error",   () => resolve(false));
      req.on("timeout", () => { req.destroy(); resolve(false); });
    } catch { resolve(false); }
  });
}

async function main() {
  console.log(`\n${CYAN}${BOLD}  ══════════════════════════════════════════════${RESET}`);
  console.log(`${CYAN}${BOLD}    TECH-TITAN :: VERIFICACIÓN DEL SISTEMA     ${RESET}`);
  console.log(`${CYAN}${BOLD}  ══════════════════════════════════════════════${RESET}`);
  console.log(`${DIM}  ${new Date().toLocaleString("es-ES")}${RESET}\n`);

  const checks = await Promise.all([
    checkTCP("localhost", 5433),
    checkTCP("localhost", 6379),
    checkHTTP("http://localhost:9000/health"),
    checkHTTP("http://localhost:3000"),
  ]);

  const [pgOk, redisOk, apiOk, appOk] = checks;
  let passed = 0;
  let failed = 0;

  const services = [
    { name: "PostgreSQL", port: 5433, ok: pgOk,
      fix: "cd capa-datos && docker compose up -d postgres" },
    { name: "Redis",      port: 6379, ok: redisOk,
      fix: "cd capa-datos && docker compose up -d redis" },
    { name: "MedusaJS API", port: 9000, ok: apiOk,
      fix: "cd capa-negocio && npm run develop" },
    { name: "Next.js App",  port: 3000, ok: appOk,
      fix: "cd capa-presentacion && npm run dev" },
  ];

  for (const svc of services) {
    if (svc.ok) {
      console.log(ok(`${BOLD}${svc.name}${RESET} — puerto ${svc.port} activo`));
      passed++;
    } else {
      console.log(fail(`${BOLD}${svc.name}${RESET} — puerto ${svc.port} NO responde`));
      console.log(info(`→ ${YELLOW}${svc.fix}${RESET}`));
      failed++;
    }
  }

  console.log(`\n${CYAN}  ──────────────────────────────────────────────${RESET}`);

  if (failed === 0) {
    console.log(`${GREEN}${BOLD}  ✓ SISTEMA LISTO — ${passed}/4 servicios activos${RESET}`);
    console.log(`${DIM}  Frontend → http://localhost:3000${RESET}`);
    console.log(`${DIM}  Backend  → http://localhost:9000/health${RESET}`);
    console.log(`${DIM}  Admin HW → http://localhost:3000/admin${RESET}`);
  } else {
    console.log(`${RED}${BOLD}  ✗ ${failed} servicio(s) caído(s) — ejecuta: npm run dev${RESET}`);
  }

  console.log(`${CYAN}  ══════════════════════════════════════════════${RESET}\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
