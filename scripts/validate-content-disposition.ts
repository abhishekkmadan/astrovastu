/**
 * Lightweight validation for attachmentContentDisposition (no test runner in repo).
 * Run: node --experimental-strip-types scripts/validate-content-disposition.ts
 */
import { attachmentContentDisposition } from "../src/lib/http/content-disposition.ts";

const cases = [
  "शिव निवास",
  'Report "Q1"',
  "Foo\r\nBar",
  "Café",
  "normal",
  "",
  "rajesh sharma",
  "あいうえお",
];

let failed = 0;
for (const name of cases) {
  try {
    const value = attachmentContentDisposition(name);
    new Headers().set("Content-Disposition", value);
    if (!value.includes("filename*=UTF-8''")) {
      console.error("FAIL missing filename*:", JSON.stringify(name), value);
      failed++;
      continue;
    }
    console.log("OK", JSON.stringify(name));
  } catch (e) {
    console.error("FAIL", JSON.stringify(name), e instanceof Error ? e.message : e);
    failed++;
  }
}

// Regression: raw Unicode in filename= must throw (documents the bug we fixed)
try {
  new Headers().set(
    "Content-Disposition",
    `attachment; filename="शिव-vastu-report.pdf"`
  );
  console.error("FAIL: expected raw Unicode filename to throw");
  failed++;
} catch {
  console.log("OK raw Unicode filename still rejected by Headers");
}

if (failed > 0) {
  process.exit(1);
}
console.log(`All ${cases.length + 1} checks passed`);
