import { z } from "zod";
import { getStudent } from "@/lib/data";
import { DEMO_MODE, telegramEnabled } from "@/lib/env";
import { formatTelegramMessage } from "@/lib/parent-messages";
import { sendTelegramMessage } from "@/lib/telegram";

const BodySchema = z.object({ studentId: z.string(), text: z.string().min(1).max(3500) });

export type TelegramResponse =
  | { ok: true; demo?: boolean }
  | { ok: false; retryAfter?: number; error: string };

// One message per request: the client paces the queue, so no request runs long
// and the teacher sees progress message by message.
export async function POST(request: Request) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !getStudent(parsed.data.studentId)) {
    return Response.json({ ok: false, error: "Noto'g'ri so'rov" } satisfies TelegramResponse, { status: 400 });
  }

  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 150));
    return Response.json({ ok: true, demo: true } satisfies TelegramResponse);
  }
  if (!telegramEnabled()) {
    return Response.json({ ok: false, error: "Telegram sozlanmagan" } satisfies TelegramResponse, { status: 503 });
  }

  const result = await sendTelegramMessage(formatTelegramMessage(parsed.data.studentId, parsed.data.text));
  return Response.json(result satisfies TelegramResponse, { status: result.ok ? 200 : 502 });
}
