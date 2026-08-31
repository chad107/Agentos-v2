let counter = 0;

/** Deterministic-enough ids for a single-process demo (no external id service needed). */
export function makeId(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}`;
}
