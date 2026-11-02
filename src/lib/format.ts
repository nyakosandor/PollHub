export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function toPercent(part: number, total: number) {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

/** Joins items into a readable list, e.g. "A, B, and C". */
export function formatList(items: string[]) {
  return new Intl.ListFormat("en", { type: "conjunction" }).format(items);
}
