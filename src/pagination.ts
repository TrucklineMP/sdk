export type PageFetchResult<T> = {
  items: T[];
  done: boolean;
};

export async function* iteratePages<T>(
  fetchPage: (pageIndex: number) => Promise<PageFetchResult<T>>,
  options?: { maxPages?: number },
): AsyncGenerator<T[], void, unknown> {
  const maxPages = options?.maxPages ?? 100;
  for (let page = 0; page < maxPages; page++) {
    const result = await fetchPage(page);
    if (result.items.length === 0) return;
    yield result.items;
    if (result.done) return;
  }
}

export async function collectPages<T>(
  fetchPage: (pageIndex: number) => Promise<PageFetchResult<T>>,
  options?: { maxPages?: number; maxItems?: number },
): Promise<T[]> {
  const out: T[] = [];
  const maxItems = options?.maxItems ?? Number.POSITIVE_INFINITY;
  for await (const page of iteratePages(fetchPage, options)) {
    for (const item of page) {
      out.push(item);
      if (out.length >= maxItems) return out;
    }
  }
  return out;
}
