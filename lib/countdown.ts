/** Formats a millisecond duration as "2d 5h 12m", "5h 12m", "12m 4s", or "4s". */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/** Whole number of days left (rounded up) until the target timestamp. */
export function daysRemaining(targetIso: string, now: number): number {
  const msLeft = new Date(targetIso).getTime() - now;
  return Math.max(0, Math.ceil(msLeft / 86400000));
}
