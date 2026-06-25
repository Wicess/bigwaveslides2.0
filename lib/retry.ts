// lib/retry.ts
// -----------------------------------------------------------------------------
// A small wrapper that re-runs a flaky async function a few times before giving
// up. This is mainly to smooth over the Neon (serverless Postgres) database
// occasionally being slow to "wake up", which can cause the first query to time
// out. Wrap a database call (or any operation that may fail transiently) with
// withRetry(() => doTheThing()).
// -----------------------------------------------------------------------------

/**
 * Retry an async operation a few times with linear backoff.
 * Smooths over transient Neon cold-connection timeouts.
 *
 * "Linear backoff" = the wait between tries grows steadily each round so we
 * don't hammer a struggling service. With delayMs=300 the pauses are
 * 300ms, then 600ms, etc. (delayMs * attemptNumber).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  delayMs = 300,
): Promise<T> {
  // Remember the most recent error so we can re-throw it if every try fails.
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      // Success: return immediately, no more retries needed.
      return await fn();
    } catch (error) {
      lastError = error;
      // Only wait-and-retry if more attempts remain. On the final attempt we
      // skip the delay and fall through to throwing below.
      if (i < attempts - 1) {
        // Wait an increasing amount of time before the next try.
        await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }
  // All attempts failed — surface the last error to the caller.
  throw lastError;
}
