#!/usr/bin/env node
/**
 * Regression test for the empty Overlap Alerts defect.
 *
 * Root cause guarded here: the demo store initialised `overlapAlerts` to an
 * empty array and only ran detection on mutations, so a fresh load rendered an
 * empty table. This test requires the REAL demo modules (compiled to a temp
 * folder) and asserts that:
 *   1. the initial demo state exposes a nonzero, seeded set of alerts;
 *   2. per-status counts agree with the records actually returned;
 *   3. every alert carries the fields the Overlap Alerts page renders;
 *   4. re-detection is idempotent and preserves seeded/runtime review decisions;
 *   5. a review updates the alert and its counts;
 *   6. an unrelated complaint status change keeps the decision intact;
 *   7. resetDemoData restores the seeded review states.
 *
 * Run with: npm run test:overlaps
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const cacheDir = path.join(root, "node_modules", ".cache", "institution360-overlap-test");
const outDir = path.join(cacheDir, "out");

const EXPECTED_COUNTS = {
  new: 8,
  reviewed: 2,
  related: 1,
  not_overlapping: 1,
  coordination_required: 1,
};
const EXPECTED_TOTAL = Object.values(EXPECTED_COUNTS).reduce((a, b) => a + b, 0);

function countByStatus(alerts) {
  const counts = {
    new: 0,
    reviewed: 0,
    related: 0,
    not_overlapping: 0,
    coordination_required: 0,
  };
  for (const a of alerts) counts[a.alertStatus] += 1;
  return counts;
}

function compileDemoModules() {
  fs.rmSync(cacheDir, { recursive: true, force: true });
  fs.mkdirSync(cacheDir, { recursive: true });

  const toPosix = (p) => p.replace(/\\/g, "/");
  const tsconfig = {
    compilerOptions: {
      module: "commonjs",
      target: "es2020",
      moduleResolution: "node",
      esModuleInterop: true,
      skipLibCheck: true,
      strict: true,
      outDir: toPosix(outDir),
      rootDir: toPosix(path.join(root, "src")),
      baseUrl: toPosix(root),
      paths: { "@/*": ["src/*"] },
    },
    include: [
      toPosix(path.join(root, "src/data/demo-data.ts")),
      toPosix(path.join(root, "src/lib/formatting.ts")),
      toPosix(path.join(root, "src/lib/overlap-detection.ts")),
      toPosix(path.join(root, "src/lib/demo-state.ts")),
    ],
  };
  const tsconfigPath = path.join(cacheDir, "tsconfig.test.json");
  fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));

  execSync(`npx tsc -p "${tsconfigPath}"`, { cwd: root, stdio: "inherit" });

  const aliasReplacements = {
    'require("@/data/demo-data")': (file) => {
      const rel = path.relative(path.dirname(file), path.join(outDir, "data", "demo-data.js"));
      return `require(${JSON.stringify(rel.replace(/\\/g, "/").replace(/^/, "./"))})`;
    },
    'require("@/lib/overlap-detection")': (file) => {
      const rel = path.relative(path.dirname(file), path.join(outDir, "lib", "overlap-detection.js"));
      return `require(${JSON.stringify(rel.replace(/\\/g, "/").replace(/^/, "./"))})`;
    },
    'require("@/lib/formatting")': (file) => {
      const rel = path.relative(path.dirname(file), path.join(outDir, "lib", "formatting.js"));
      return `require(${JSON.stringify(rel.replace(/\\/g, "/").replace(/^/, "./"))})`;
    },
  };

  const jsFiles = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".js")) jsFiles.push(full);
    }
  };
  walk(outDir);

  for (const file of jsFiles) {
    let code = fs.readFileSync(file, "utf8");
    for (const [spec, replacer] of Object.entries(aliasReplacements)) {
      code = code.split(spec).join(replacer(file));
    }
    if (code.includes('require("@/')) {
      throw new Error(`Unresolved @/ require left in ${file}`);
    }
    fs.writeFileSync(file, code);
  }
}

function main() {
  compileDemoModules();
  const state = require(path.join(outDir, "lib", "demo-state.js"));

  // 1. Initial demo state must expose seeded alerts (the regression).
  const initial = state.getOverlapAlerts();
  assert.ok(
    initial.length > 0,
    "initial demo state must expose a nonzero set of overlap alerts (empty-table regression)"
  );
  assert.equal(initial.length, EXPECTED_TOTAL, "seeded alert count");
  console.log(`PASS initial alerts visible: ${initial.length}`);

  // 2. Counts agree with the records actually returned.
  const initialCounts = countByStatus(initial);
  assert.deepEqual(initialCounts, EXPECTED_COUNTS, "per-status counts must match seeded records");
  assert.equal(
    Object.values(initialCounts).reduce((a, b) => a + b, 0),
    initial.length,
    "status counts must sum to the returned record count"
  );
  console.log(`PASS status counts match records: ${JSON.stringify(initialCounts)}`);

  // 3. Every record carries the fields the page renders.
  const ids = new Set();
  for (const alert of initial) {
    assert.ok(alert.id && !ids.has(alert.id), "unique alert id");
    ids.add(alert.id);
    assert.ok(alert.institutionName, "institution name present");
    assert.match(alert.institutionAicteId, /^AICTE-DEMO-\d+$/, "canonical AICTE ID present");
    assert.ok(Array.isArray(alert.caseIds) && alert.caseIds.length >= 2, "at least two cases");
    assert.equal(new Set(alert.caseIds).size, alert.caseIds.length, "case ids unique per alert");
    assert.ok(Array.isArray(alert.bureauNames) && alert.bureauNames.length >= 2, "at least two bureaus");
    assert.equal(alert.statuses.length, alert.caseIds.length, "status per case");
    assert.ok(Array.isArray(alert.matchReasons) && alert.matchReasons.length > 0, "match reasons present");
    assert.ok(alert.latestActionDates.length > 0, "latest action dates present");
  }
  console.log("PASS all alert records carry page-rendering fields");

  // 4. Re-detection is idempotent and preserves review decisions.
  state.setComplaints(state.getComplaints());
  const redetected = state.getOverlapAlerts();
  assert.equal(redetected.length, initial.length, "no duplicate alerts on re-detection");
  assert.deepEqual(
    redetected.map((a) => a.id).sort(),
    initial.map((a) => a.id).sort(),
    "same alert ids on re-detection"
  );
  const seededReviewed = redetected.find((a) => a.institutionAicteId === "AICTE-DEMO-1002");
  assert.equal(seededReviewed.alertStatus, "reviewed", "seeded review preserved");
  assert.equal(seededReviewed.reviewedBy, "Chaitrali Narkhede", "seeded reviewer preserved");
  console.log("PASS re-detection idempotent, seeded review preserved");

  // 5. A review updates the alert and the counts.
  const target = redetected.find((a) => a.institutionAicteId === "AICTE-DEMO-1003");
  assert.equal(target.alertStatus, "new", "target alert starts pending");
  assert.ok(
    state.updateAlertStatus(target.id, "related", "Regression test review", "user-005"),
    "review action succeeds"
  );
  let current = state.getOverlapAlerts();
  assert.equal(
    current.find((a) => a.id === target.id).alertStatus,
    "related",
    "review status updated"
  );
  let counts = countByStatus(current);
  assert.equal(counts.new, EXPECTED_COUNTS.new - 1, "pending count decreases");
  assert.equal(counts.related, EXPECTED_COUNTS.related + 1, "related count increases");
  console.log("PASS review updates alert and counts");

  // 6. An unrelated complaint mutation keeps the decision intact.
  const unrelated = state.updateComplaintStatus(
    "complaint-004",
    "Under Process",
    "user-001",
    "Regression test unrelated status change"
  );
  assert.ok(unrelated.success, "unrelated status change applies");
  current = state.getOverlapAlerts();
  assert.equal(
    current.find((a) => a.id === target.id).alertStatus,
    "related",
    "review decision survives unrelated mutation"
  );
  console.log("PASS review decision survives unrelated status change");

  // 7. Reset restores the seeded dataset and review states.
  state.resetDemoData();
  const afterReset = state.getOverlapAlerts();
  assert.equal(afterReset.length, EXPECTED_TOTAL, "reset restores alert count");
  assert.deepEqual(countByStatus(afterReset), EXPECTED_COUNTS, "reset restores seeded review states");
  console.log("PASS reset restores seeded alerts and review states");

  console.log("\nAll overlap regression checks passed.");
}

try {
  main();
} catch (err) {
  console.error("\nOverlap regression test FAILED:");
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
