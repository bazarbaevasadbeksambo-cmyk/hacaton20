import "server-only";
import { z } from "zod";
import { askJson } from "./client";

const ReadSchema = z.strictObject({
  answers: z.array(
    z.strictObject({
      // Plain number: .int() would emit min/max bounds that structured outputs may reject.
      n: z.number(),
      read: z.string(),
      confidence: z.number(),
    }),
  ),
});

export type ReadAnswer = z.infer<typeof ReadSchema>["answers"][number];

const SYSTEM = `You read handwritten answers from a photo of a printed school math worksheet.
The sheet has numbered answer boxes with thick borders. Read ONLY what is written inside each box — do not solve the tasks and do not correct the student.
Write fractions as "a/b", mixed numbers as "w a/b" (e.g. "3 2/5"), comparisons as ">", "<" or "=".
If a box is empty, return read "" with confidence 1. If handwriting is ambiguous, give your best reading and a lower confidence (0..1).`;

/** Asks Claude to transcribe the answer boxes. Correctness is decided later, in code. */
export async function readSheet(imageBase64: string, mediaType: "image/jpeg" | "image/png", boxCount: number) {
  const result = await askJson({
    schema: ReadSchema,
    system: SYSTEM,
    content: [
      { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
      {
        type: "text",
        text: `The sheet has ${boxCount} numbered answer boxes (1–${boxCount}). Read the answer in each box.`,
      },
    ],
  });
  if (!result) return null;

  // Keep exactly one reading per expected box; clamp confidence into [0, 1].
  return Array.from({ length: boxCount }, (_, i) => {
    const found = result.answers.find((a) => a.n === i + 1);
    return {
      n: i + 1,
      read: found?.read.trim() ?? "",
      confidence: Math.max(0, Math.min(1, found?.confidence ?? 0)),
    };
  });
}
