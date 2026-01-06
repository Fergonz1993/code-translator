// ===== RETRY UTILITIES =====
// Small retry helper for transient provider errors.

export type RetryOptions = {
  retries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  shouldRetry: (error: unknown) => boolean;
};

function sleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export function isRetryableError(error: unknown): boolean {
  if (typeof error === "object" && error !== null) {
    const status = (error as { status?: number }).status;
    if (status && [408, 429, 500, 502, 503, 504].includes(status)) {
      return true;
    }
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("invalid api key") || message.includes("api key")) {
      return false;
    }

    if (message.includes("timeout") || message.includes("timed out")) {
      return true;
    }

    if (message.includes("rate") || message.includes("429")) {
      return true;
    }

    if (message.includes("overloaded") || message.includes("temporarily")) {
      return true;
    }
  }

  return false;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= options.retries || !options.shouldRetry(error)) {
        throw error;
      }

      const delayMs = Math.min(
        options.maxDelayMs,
        options.baseDelayMs * Math.pow(2, attempt)
      );

      attempt += 1;
      await sleep(delayMs);
    }
  }
}
