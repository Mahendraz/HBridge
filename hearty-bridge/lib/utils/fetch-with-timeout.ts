/**
 * fetch() has no default timeout — a stalled request (dead connection, a
 * handler that never resolves) leaves callers awaiting forever, which reads
 * to the user as an infinite loading spinner with no way out. This wraps
 * fetch with an AbortController-based timeout so a stalled request always
 * surfaces as a catchable error instead of hanging indefinitely.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 20_000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms: ${input}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
