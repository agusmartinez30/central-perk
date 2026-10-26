export type Page<T> = {
  items: T[];
  /** Current page, clamped to the available pages (1-based). */
  page: number;
  pageCount: number;
  /** 1-based position of the first and last row shown; 0 when empty. */
  from: number;
  to: number;
  total: number;
};

export function paginate<T>(items: readonly T[], page: number, size: number): Page<T> {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / size));
  const current = Math.min(Math.max(1, page), pageCount);
  const start = (current - 1) * size;
  const slice = items.slice(start, start + size);
  return {
    items: slice,
    page: current,
    pageCount,
    from: slice.length > 0 ? start + 1 : 0,
    to: start + slice.length,
    total,
  };
}

export type PageItem = number | "ellipsis";

/** Pagination buttons: first, last, the current page and its neighbours, with gaps as "…". */
export function getPageItems(current: number, pageCount: number): PageItem[] {
  const pages = new Set([1, pageCount, current - 1, current, current + 1]);
  if (current <= 2) [2, 3].forEach((page) => pages.add(page));
  if (current >= pageCount - 1) [pageCount - 1, pageCount - 2].forEach((page) => pages.add(page));
  const sorted = [...pages].filter((page) => page >= 1 && page <= pageCount).sort((a, b) => a - b);
  const items: PageItem[] = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) items.push("ellipsis");
    items.push(page);
  });
  return items;
}
