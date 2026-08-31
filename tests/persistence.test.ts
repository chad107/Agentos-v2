import { describe, expect, it, afterAll } from "vitest";
import { rmSync } from "node:fs";

// persistenceEnabled() returns false whenever process.env.VITEST is set (which
// vitest sets automatically), so these tests exercise the module's functions
// directly against a real temp SQLite file, bypassing that guard on purpose —
// the guard itself is proven by tests/store... (no .data/ dir appears from a
// normal `npm run test` run). This suite verifies the underlying save/load
// round-trip actually works when persistence *would* be enabled.
const TEST_DB_PATH = ".data/test-persistence.sqlite";
process.env.AGENTOS_DB_PATH = TEST_DB_PATH;
const originalVitestFlag = process.env.VITEST;

describe("persistence — save/load round-trip (src/data/persistence.ts)", () => {
  afterAll(() => {
    if (originalVitestFlag !== undefined) process.env.VITEST = originalVitestFlag;
    rmSync(".data", { recursive: true, force: true });
  });

  it("round-trips a JSON-serializable snapshot exactly", async () => {
    delete process.env.VITEST; // simulate persistence being enabled for this one check
    const persistence = await import("@/data/persistence");
    expect(persistence.persistenceEnabled()).toBe(true);

    const sample = { leads: [{ id: "lead_1", stage: "new" }], count: 3, note: "round-trip test" };
    persistence.saveSnapshot(sample);
    const loaded = persistence.loadSnapshot<typeof sample>();
    expect(loaded).toEqual(sample);

    process.env.VITEST = "true";
  });

  it("returns null when persistence is disabled (the normal test-run state)", async () => {
    process.env.VITEST = "true";
    const persistence = await import("@/data/persistence");
    expect(persistence.persistenceEnabled()).toBe(false);
    expect(persistence.loadSnapshot()).toBeNull();
  });
});
