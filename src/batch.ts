import { BATCH_MAX } from "./types.js";

export function chunkIds<T>(ids: T[], size = BATCH_MAX): T[][] {
  const unique = [...new Set(ids)];
  const chunks: T[][] = [];
  for (let i = 0; i < unique.length; i += size) {
    chunks.push(unique.slice(i, i + size));
  }
  return chunks;
}

export function normalizeIdList(
  ids: Array<string | number> | string | number,
  ...rest: Array<string | number>
): string[] {
  const list = Array.isArray(ids) ? ids : [ids, ...rest];
  return list.map((id) => String(id));
}
