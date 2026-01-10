// ===== REQUEST BODY UTILITIES =====
// Helpers to safely read/parse request bodies with a hard size limit.
//
// Why this exists:
// - `request.json()` reads the full body into memory.
// - An attacker (or buggy client) can send a very large payload and waste CPU/memory.
// - We already validate fields with Zod, but we want an early "byte limit" guard.

// ===== ERRORS =====

export class RequestBodyTooLargeError extends Error {
  readonly maxBytes: number;

  constructor(maxBytes: number) {
    super(`Request payload too large (max ${maxBytes} bytes).`);
    this.name = "RequestBodyTooLargeError";
    this.maxBytes = maxBytes;
  }
}

export class InvalidJsonBodyError extends Error {
  constructor() {
    super("Invalid JSON body.");
    this.name = "InvalidJsonBodyError";
  }
}

// ===== HELPERS =====

function parseContentLengthBytes(headerValue: string | null): number | null {
  if (!headerValue) return null;

  const parsed = Number(headerValue);
  if (!Number.isFinite(parsed)) return null;

  const bytes = Math.floor(parsed);
  if (bytes < 0) return null;

  return bytes;
}

async function readBodyBytesWithLimit(request: Request, maxBytes: number): Promise<Uint8Array> {
  // If the caller provided Content-Length, we can reject without reading.
  const contentLength = parseContentLengthBytes(request.headers.get("content-length"));
  if (contentLength !== null && contentLength > maxBytes) {
    throw new RequestBodyTooLargeError(maxBytes);
  }

  // Prefer streaming reads so we can stop early.
  if (request.body) {
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      total += value.byteLength;
      if (total > maxBytes) {
        throw new RequestBodyTooLargeError(maxBytes);
      }

      chunks.push(value);
    }

    const buffer = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return buffer;
  }

  // Fallback: body already consumed or unavailable.
  const arrayBuffer = await request.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  if (bytes.byteLength > maxBytes) {
    throw new RequestBodyTooLargeError(maxBytes);
  }

  return bytes;
}

// ===== PUBLIC API =====

export async function readJsonBodyWithLimit(request: Request, maxBytes: number): Promise<unknown> {
  const bytes = await readBodyBytesWithLimit(request, maxBytes);

  const text = new TextDecoder().decode(bytes);
  if (!text.trim()) {
    throw new InvalidJsonBodyError();
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new InvalidJsonBodyError();
  }
}
