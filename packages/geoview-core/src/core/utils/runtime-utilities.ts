// GV Leaf module imported by logger.ts at load time: keep it free of internal imports or it recreates an import cycle (#3711)

/**
 * Checks whether the current environment is running on localhost port 8080.
 *
 * @returns True if the current hostname is localhost and the port is 8080; otherwise, false
 */
export function isLocalhost(): boolean {
  if (typeof window === 'undefined' || !window.location) return false;
  return window.location.hostname === 'localhost' && window.location.port === '8080';
}

/**
 * Formats a duration in milliseconds into a compact human-readable string.
 *
 * @param durationMs - The duration in milliseconds to format
 * @returns A formatted string such as "150ms", "2.500s", "3m 05s", or "1h 03m 05s"
 */
export function formatDuration(durationMs: number): string {
  const ms = Math.max(0, durationMs);

  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(3)}s`;

  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.round((ms % 60000) / 1000);

  if (hours) return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}
