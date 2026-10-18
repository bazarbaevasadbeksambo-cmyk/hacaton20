import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { ANTHROPIC_MODEL } from "@/lib/env";

let client: Anthropic | null = null;
function getClient() {
  client ??= new Anthropic({ timeout: 60_000, maxRetries: 1 });
  return client;
}

// Server-side refusal fallback is supported on these models; elsewhere we rely on our own /data fallback.
const FALLBACK_MODELS = new Set(["claude-opus-5-5", "claude-opus-5", "claude-sonnet-5-5", "claude-fable-5-1"]);

/**
 * Plain-text chat reply (for the student helper). One retry, then null so the caller falls back.
 */
export async function askText({
  system,
  messages,
  maxTokens = 2000,
}: {
  system: string;
  messages: Anthropic.Beta.BetaMessageParam[];
  maxTokens?: number;
}): Promise<string | null> {
  const useFallbacks = FALLBACK_MODELS.has(ANTHROPIC_MODEL);
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await getClient().beta.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: maxTokens,
        system,
        messages,
        output_config: { effort: "low" },
        ...(useFallbacks ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
      });
      if (response.stop_reason === "refusal") continue;
      const text = response.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("")
        .trim();
      if (text) return text;
    } catch (error) {
      if (error instanceof Anthropic.AuthenticationError) return null;
      console.warn(`[ai] text attempt ${attempt} failed:`, error instanceof Error ? error.message : error);
    }
  }
  return null;
}

type AskJsonParams<T extends z.ZodType> = {
  schema: T;
  system: string;
  content: Anthropic.Beta.BetaContentBlockParam[];
  maxTokens?: number;
  effort?: "low" | "medium" | "high";
};

/**
 * One structured-output call: strict JSON schema, then zod validation.
 * Retries once on any failure (API error, refusal, invalid JSON); returns null after that
 * so every caller can fall back to /data and the demo never breaks.
 */
export async function askJson<T extends z.ZodType>({
  schema,
  system,
  content,
  maxTokens = 4000,
  effort = "low",
}: AskJsonParams<T>): Promise<z.infer<T> | null> {
  // The API takes the schema body; the "$schema" dialect marker is not needed.
  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
  delete jsonSchema.$schema;
  const useFallbacks = FALLBACK_MODELS.has(ANTHROPIC_MODEL);

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await getClient().beta.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content }],
        output_config: { effort, format: { type: "json_schema", schema: jsonSchema } },
        ...(useFallbacks ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
      });
      if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
        console.warn(`[ai] attempt ${attempt}: stop_reason=${response.stop_reason}`);
        continue;
      }
      const text = response.content.find((b) => b.type === "text")?.text ?? "";
      const parsed = schema.safeParse(JSON.parse(text));
      if (parsed.success) return parsed.data;
      console.warn(`[ai] attempt ${attempt}: schema mismatch`, parsed.error.issues.slice(0, 3));
    } catch (error) {
      if (error instanceof Anthropic.AuthenticationError) {
        console.error("[ai] authentication failed — check ANTHROPIC_API_KEY");
        return null; // retrying will not help
      }
      console.warn(`[ai] attempt ${attempt} failed:`, error instanceof Error ? error.message : error);
    }
  }
  return null;
}
