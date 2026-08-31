/**
 * Local file-backed durability for the in-memory store (src/data/store.ts).
 *
 * IMPORTANT — what this is and isn't: this makes data survive a process
 * restart on a single, self-hosted server instance (README.md's
 * human-developer punch list, item 1: "nothing here survives a deploy").
 * It is deliberately NOT a normalized relational schema, and it will NOT
 * work correctly on a multi-instance or serverless/edge deployment (each
 * instance would have its own local file, with no shared source of truth)
 * — picking a real production database, designing its schema, and writing
 * migrations remains the "Human Review Required" decision flagged in
 * 03_GAP_ANALYSIS.md gap M. This is a stopgap for local/self-hosted
 * single-process operation, not the final production persistence
 * architecture.
 *
 * Uses Node's built-in `node:sqlite` (no new npm dependency; requires
 * Node >=22.5, available in this environment) to store one JSON-serialized
 * snapshot of the entire store. Every field in `Store` (src/data/store.ts)
 * is already plain, JSON-safe data — timestamps are ISO strings, not
 * `Date` objects — so JSON round-trips it exactly, with no revival logic
 * needed.
 */

import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createRequire } from "node:module";

const DB_PATH = process.env.AGENTOS_DB_PATH ?? ".data/agentos.sqlite";

/**
 * True only when persistence should actually run: never under the test
 * runner (vitest sets `process.env.VITEST`, and tests depend on a fresh
 * seeded store every time — hydrating from a prior run's disk snapshot
 * would silently break test determinism), and never during `next build`'s
 * static generation (Next sets `NEXT_PHASE=phase-production-build`) —
 * only the actually-running server needs durability.
 */
export function persistenceEnabled(): boolean {
  if (process.env.VITEST) return false;
  if (process.env.NEXT_PHASE === "phase-production-build") return false;
  return true;
}

interface SqliteStatement {
  run(...args: unknown[]): unknown;
  get(...args: unknown[]): unknown;
}
interface SqliteDatabase {
  exec(sql: string): void;
  prepare(sql: string): SqliteStatement;
}

let db: SqliteDatabase | null | undefined;

/** `require`, not a static `import` — so an environment without `node:sqlite` degrades to "no persistence" instead of a hard module-load crash. */
function getDb(path: string = DB_PATH): SqliteDatabase | null {
  if (db !== undefined) return db;
  try {
    const nodeRequire = createRequire(import.meta.url);
    const { DatabaseSync } = nodeRequire("node:sqlite") as typeof import("node:sqlite");
    const dir = dirname(path);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const instance = new DatabaseSync(path) as unknown as SqliteDatabase;
    instance.exec(
      "CREATE TABLE IF NOT EXISTS store_snapshot (id INTEGER PRIMARY KEY CHECK (id = 1), snapshot TEXT NOT NULL, updated_at TEXT NOT NULL)"
    );
    db = instance;
  } catch (err) {
    console.warn("[persistence] node:sqlite unavailable — falling back to in-memory-only store.", err);
    db = null;
  }
  return db;
}

export function loadSnapshot<T>(): T | null {
  if (!persistenceEnabled()) return null;
  const database = getDb();
  if (!database) return null;
  try {
    const row = database.prepare("SELECT snapshot FROM store_snapshot WHERE id = 1").get() as
      | { snapshot: string }
      | undefined;
    return row ? (JSON.parse(row.snapshot) as T) : null;
  } catch (err) {
    console.warn("[persistence] failed to load snapshot — starting from seed data instead.", err);
    return null;
  }
}

export function saveSnapshot(value: unknown): void {
  if (!persistenceEnabled()) return;
  const database = getDb();
  if (!database) return;
  try {
    const json = JSON.stringify(value);
    database
      .prepare(
        "INSERT INTO store_snapshot (id, snapshot, updated_at) VALUES (1, ?, ?) " +
          "ON CONFLICT(id) DO UPDATE SET snapshot = excluded.snapshot, updated_at = excluded.updated_at"
      )
      .run(json, new Date().toISOString());
  } catch (err) {
    console.warn("[persistence] failed to save snapshot.", err);
  }
}
