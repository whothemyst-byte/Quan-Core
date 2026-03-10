export function parseSseChunk(chunk: string): string[] {
  return chunk
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.replace("data:", "").trim())
    .filter((line) => line.length > 0 && line !== "[DONE]");
}

