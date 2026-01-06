// ===== STREAMING RESPONSE HANDLER =====
// Handle streaming responses from AI providers.

export interface StreamChunk {
  content: string;
  done: boolean;
  lineNumber?: number;
}

export type StreamCallback = (chunk: StreamChunk) => void;

/**
 * Process a streaming response and call callback for each chunk.
 */
export async function processStream(
  response: Response,
  onChunk: StreamCallback
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Response body is not readable");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let fullContent = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      onChunk({ content: "", done: true });
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    // Process complete lines
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || "";
          if (content) {
            fullContent += content;
            onChunk({ content, done: false });
          }
        } catch {
          // Ignore parse errors for incomplete JSON
        }
      }
    }
  }

  return fullContent;
}

/**
 * Create a ReadableStream from chunks for progressive rendering.
 */
export function createChunkStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let index = 0;

  return new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index]));
        index++;
      } else {
        controller.close();
      }
    },
  });
}
