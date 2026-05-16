/**
 * Patch: MedusaJS 1.20.x + TypeORM 0.3.17+
 *
 * payment-provider, notification, tax-provider y fulfillment-provider usan
 * `repo.update({}, { is_installed: false })` para resetear providers.
 * TypeORM 0.3.17+ rechaza criterios vacios. Se usa QueryBuilder en su lugar.
 *
 * Issue: https://github.com/medusajs/medusa/issues/6463
 */
const fs   = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "../node_modules/@medusajs/medusa/dist/services");

const PATCHES = [
  {
    file: "payment-provider.js",
    old: "return [4 /*yield*/, model.update({}, { is_installed: false })];",
    new: "return [4 /*yield*/, model.createQueryBuilder().update().set({ is_installed: false }).execute()];",
  },
  {
    file: "notification.js",
    old: "return [4 /*yield*/, model.update({}, { is_installed: false })];",
    new: "return [4 /*yield*/, model.createQueryBuilder().update().set({ is_installed: false }).execute()];",
  },
  {
    file: "tax-provider.js",
    old: "return [4 /*yield*/, model.update({}, { is_installed: false })];",
    new: "return [4 /*yield*/, model.createQueryBuilder().update().set({ is_installed: false }).execute()];",
  },
  {
    file: "fulfillment-provider.js",
    old: "return [4 /*yield*/, fulfillmentProviderRepo.update({}, { is_installed: false })];",
    new: "return [4 /*yield*/, fulfillmentProviderRepo.createQueryBuilder().update().set({ is_installed: false }).execute()];",
  },
];

PATCHES.forEach(({ file, old: OLD, new: NEW }) => {
  const filepath = path.join(DIR, file);

  if (!fs.existsSync(filepath)) {
    console.log(`[patch-medusa] ${file}: not found.`);
    return;
  }

  const content = fs.readFileSync(filepath, "utf8");

  if (content.includes(NEW)) {
    console.log(`[patch-medusa] ${file}: already patched.`);
    return;
  }

  if (!content.includes(OLD)) {
    console.log(`[patch-medusa] ${file}: target not found - may be fixed upstream.`);
    return;
  }

  fs.writeFileSync(filepath, content.replace(OLD, NEW), "utf8");
  console.log(`[patch-medusa] ${file}: patched.`);
});
