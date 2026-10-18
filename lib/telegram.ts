import "server-only";

export type TelegramResult = { ok: true } | { ok: false; retryAfter?: number; error: string };

/** Direct Bot API call — no library needed for one method. */
export async function sendTelegramMessage(text: string): Promise<TelegramResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { ok: false, error: "Telegram sozlanmagan" };

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(10_000),
    });
    const data = (await res.json()) as { ok: boolean; description?: string; parameters?: { retry_after?: number } };
    if (data.ok) return { ok: true };
    return { ok: false, retryAfter: data.parameters?.retry_after, error: data.description ?? `HTTP ${res.status}` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Tarmoq xatosi" };
  }
}
