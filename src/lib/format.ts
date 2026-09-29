export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function toPercent(part: number, total: number) {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}
