/**
 * Minimal ambient types for `node:sqlite` (src/data/persistence.ts).
 * The installed `@types/node` (^20.x) predates this Node 22.5+ built-in
 * module, so its real, richer type declarations aren't available here.
 * This declares only the surface this codebase actually uses.
 */
declare module "node:sqlite" {
  export interface StatementResultingChanges {
    changes: number | bigint;
    lastInsertRowid: number | bigint;
  }

  export class StatementSync {
    run(...params: unknown[]): StatementResultingChanges;
    get(...params: unknown[]): Record<string, unknown> | undefined;
    all(...params: unknown[]): Record<string, unknown>[];
  }

  export class DatabaseSync {
    constructor(path: string, options?: Record<string, unknown>);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
