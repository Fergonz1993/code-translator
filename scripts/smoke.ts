// ===== SMOKE TEST (PRODUCTION BUILD) =====
// Starts the built Next.js app and performs a couple of basic checks.
//
// This is intentionally lightweight (no Playwright) to keep CI fast and low-risk.

import fs from "node:fs";
import net from "node:net";
import { spawn } from "node:child_process";

const MAX_OUTPUT_LINES = 40;
let lastServerOutput: string[] = [];

function recordServerOutput(chunk: Buffer): void {
  const text = chunk.toString("utf8");
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);

  for (const line of lines) {
    lastServerOutput.push(line);
    if (lastServerOutput.length > MAX_OUTPUT_LINES) {
      lastServerOutput = lastServerOutput.slice(-MAX_OUTPUT_LINES);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function findFreePort(): Promise<number> {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();

    server.on("error", reject);

    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close();

      if (typeof address === "object" && address?.port) {
        resolve(address.port);
      } else {
        reject(new Error("Failed to allocate a free port."));
      }
    });
  });
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function waitForServer(baseUrl: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetchWithTimeout(`${baseUrl}/api/health`, 1500);
      if (response.ok) return;
    } catch {
      // ignore until ready
    }

    await sleep(250);
  }

  throw new Error(`Server did not become ready within ${timeoutMs}ms`);
}

async function run() {
  assert(fs.existsSync(".next"), "Missing .next build output. Run: bun run build");

  const port = await findFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;

  const env = { ...process.env };
  delete env.PORT;

  // Start the production server. We pass -p to avoid relying on PORT handling.
  const child = spawn("bun", ["run", "start", "--", "-p", String(port)], {
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout?.on("data", recordServerOutput);
  child.stderr?.on("data", recordServerOutput);

  try {
    await waitForServer(baseUrl, 20_000);

    // 1) Health should respond 200 and return a JSON object.
    const healthResponse = await fetchWithTimeout(`${baseUrl}/api/health`, 5_000);
    assert(healthResponse.ok, `Expected /api/health 200, got ${healthResponse.status}`);

    const healthJson = (await healthResponse.json()) as { status?: string };
    assert(
      healthJson && typeof healthJson === "object",
      "Expected /api/health to return a JSON object"
    );
    assert(
      healthJson.status === "healthy" || healthJson.status === "degraded",
      `Expected health status to be healthy/degraded, got ${String(healthJson.status)}`
    );

    // 2) The homepage should respond with HTML.
    const pageResponse = await fetchWithTimeout(`${baseUrl}/`, 5_000);
    assert(pageResponse.ok, `Expected / 200, got ${pageResponse.status}`);

    const contentType = pageResponse.headers.get("content-type") ?? "";
    assert(
      contentType.includes("text/html"),
      `Expected HTML response, got content-type: ${contentType}`
    );

    const html = await pageResponse.text();
    assert(html.length > 0, "Expected non-empty HTML response");
  } finally {
    child.kill();
  }
}

run().catch((error) => {
  // Keep output minimal (CI-friendly, no secrets).
  const message = error instanceof Error ? error.message : "Smoke test failed";
  // eslint-disable-next-line no-console
  console.error(message);

  if (lastServerOutput.length > 0) {
    // eslint-disable-next-line no-console
    console.error("Last server output:");
    for (const line of lastServerOutput) {
      // eslint-disable-next-line no-console
      console.error(line);
    }
  }

  process.exit(1);
});
