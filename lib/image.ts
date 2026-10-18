"use client";

import jsQR from "jsqr";
import { decodeSheetQr, type SheetQr } from "./qr";

// Phone photos are 4–12 MB; Vercel functions accept ~4.5 MB bodies.
// 1600px JPEG keeps handwriting legible for the model at ~300–500 KB.
const MAX_SIDE = 1600;

export type PreparedImage = { dataUrl: string; qr: SheetQr | null };

function scanQr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const { data } = ctx.getImageData(x, y, w, h);
  const code = jsQR(data, w, h, { inversionAttempts: "dontInvert" });
  return code ? decodeSheetQr(code.data) : null;
}

/** Downscales a photo to JPEG and reads the worksheet QR code, all in the browser. */
export async function prepareImage(file: File): Promise<PreparedImage> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  // The QR sits in the top-right corner; scanning that quarter first is faster and more robust.
  const qr = scanQr(ctx, Math.floor(w / 2), 0, Math.ceil(w / 2), Math.ceil(h / 2)) ?? scanQr(ctx, 0, 0, w, h);

  return { dataUrl: canvas.toDataURL("image/jpeg", 0.85), qr };
}

/** Runs async jobs with a fixed concurrency, reporting each completion. */
export async function runPool<T>(items: T[], limit: number, job: (item: T) => Promise<void>) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    for (let item = queue.shift(); item !== undefined; item = queue.shift()) await job(item);
  });
  await Promise.all(workers);
}
