import { z } from "zod";
import { askText } from "@/lib/ai/client";
import { helperFallback, worksheet } from "@/lib/data";
import { aiEnabled } from "@/lib/env";
import { skillName } from "@/lib/skills";

const BodySchema = z.object({
  n: z.number().int(),
  read: z.string().max(40),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(600) }))
    .max(20),
});

export type HelperResponse = { reply: string; source: "ai" | "demo" };

const SYSTEM = `Sen "Maslahatchi" — 6-sinf o'quvchisiga matematikadan yordam beradigan mehribon ustozsan.
Faqat o'zbek tilida (lotin yozuvida), sodda va qisqa gaplar bilan yoz. Markdown, jadval va emoji ishlatma.
Birinchi javobda: o'quvchining xatosi nimada ekanini 2–4 gapda tushuntir, to'g'ri yo'lni qadamlar bilan ko'rsat, oxirida "O'zing sinab ko'r:" deb o'xshash bitta misol ber (javobini aytma).
Keyingi savollarda: o'quvchi tayyor javob so'rasa, javobni aytma — faqat keyingi qadamni ko'rsat va o'zi topishiga undab qo'y.
Matematikadan boshqa mavzularda: muloyimlik bilan darsga qaytar.`;

export async function POST(request: Request) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Noto'g'ri so'rov" }, { status: 400 });

  const { n, read, messages } = parsed.data;
  const q = worksheet.questions.find((x) => x.n === n);
  if (!q) return Response.json({ error: "Savol topilmadi" }, { status: 404 });

  const fallback = helperFallback[q.skillId];
  const fallbackReply =
    messages.length === 0
      ? `Sening javobing: ${read || "bo'sh"}. ${fallback.explain}\n\n${fallback.similar}`
      : `Keling, qadamma-qadam boramiz. ${fallback.explain} Javobni o'zing topishga harakat qil — men yo'lni ko'rsataman.`;

  if (!aiEnabled()) return Response.json({ reply: fallbackReply, source: "demo" } satisfies HelperResponse);

  // The task context rides in the first user turn; the chat history follows unchanged.
  const context = `Tekshiruvdagi savol: ${q.text}\nMavzu: ${skillName(q.skillId)}\nTo'g'ri javob (faqat sen uchun): ${q.answer}\nO'quvchining javobi: ${read || "(bo'sh)"}`;
  const reply = await askText({
    system: SYSTEM,
    messages: [
      { role: "user", content: `${context}\n\nMening xatoimni tushuntirib bering.` },
      ...messages,
    ],
  });

  return Response.json({ reply: reply ?? fallbackReply, source: reply ? "ai" : "demo" } satisfies HelperResponse);
}
