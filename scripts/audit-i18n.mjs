/**
 * RoboCore Studio — Automated 5-Language i18n Parity Audit
 * Verifies exact 100% key parity across en, ta, hi, ja, and de.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.resolve(__dirname, "../ui_control_plane/src/i18n/locales");

const languages = ["en", "ta", "hi", "ja", "de"];
const dictionaries = {};

console.log("[RoboCore i18n Audit] Loading translation catalogs from:", localesDir);

for (const lang of languages) {
  const filePath = path.join(localesDir, `${lang}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`[RoboCore i18n Audit] ERROR: Missing locale dictionary: ${filePath}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  try {
    dictionaries[lang] = JSON.parse(raw);
  } catch (err) {
    console.error(`[RoboCore i18n Audit] ERROR: Invalid JSON in ${lang}.json:`, err.message);
    process.exit(1);
  }
}

const baseKeys = Object.keys(dictionaries["en"]).sort();
console.log(`[RoboCore i18n Audit] Base English catalog contains ${baseKeys.length} keys.`);

let hasError = false;

for (const lang of languages) {
  if (lang === "en") continue;
  const currentKeys = Object.keys(dictionaries[lang]).sort();
  const currentSet = new Set(currentKeys);

  const missingKeys = baseKeys.filter(k => !currentSet.has(k));
  const extraKeys = currentKeys.filter(k => !dictionaries["en"][k]);

  if (missingKeys.length > 0) {
    console.error(`[RoboCore i18n Audit] FAIL: ${lang}.json is missing ${missingKeys.length} keys:`);
    console.error(missingKeys.slice(0, 10).map(k => `  - ${k}`).join("\n"));
    hasError = true;
  }

  if (extraKeys.length > 0) {
    console.error(`[RoboCore i18n Audit] WARNING: ${lang}.json has ${extraKeys.length} extra keys:`);
    console.error(extraKeys.slice(0, 10).map(k => `  + ${k}`).join("\n"));
    hasError = true;
  }

  // Check for empty values or untranslated leaks
  for (const [key, val] of Object.entries(dictionaries[lang])) {
    if (typeof val !== "string" || val.trim().length === 0) {
      console.error(`[RoboCore i18n Audit] FAIL: Empty translation in ${lang}.json for key: ${key}`);
      hasError = true;
    }
  }

  if (missingKeys.length === 0 && extraKeys.length === 0) {
    console.log(`[RoboCore i18n Audit] PASS: ${lang}.json matches English with 100% key parity (${currentKeys.length} keys).`);
  }
}

if (hasError) {
  console.error("[RoboCore i18n Audit] Verification FAILED. Fix discrepancies.");
  process.exit(1);
} else {
  console.log("[RoboCore i18n Audit] ALL 5 LOCALES VERIFIED WITH 100% PARITY! SUCCESS.");
  process.exit(0);
}
