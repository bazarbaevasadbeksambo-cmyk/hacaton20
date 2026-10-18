// Runtime configuration. DEMO_MODE makes every API answer from /data with no external calls.

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

/** AI is usable only outside demo mode and with credentials configured. */
export function aiEnabled(): boolean {
  return !DEMO_MODE && Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export function telegramEnabled(): boolean {
  return !DEMO_MODE && Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}
