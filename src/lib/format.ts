export function toPercent(part: number, total: number) {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}
