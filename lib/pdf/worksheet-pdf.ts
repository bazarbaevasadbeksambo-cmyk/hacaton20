import "server-only";
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";
import { encodeSheetQr } from "@/lib/qr";
import type { Student, Teacher, Worksheet } from "@/lib/types";

// A4 in points.
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 40;

const INK = rgb(0.106, 0.141, 0.188); // #1B2430
const SOFT = rgb(0.357, 0.392, 0.447); // #5B6472
const GRID = rgb(0.902, 0.89, 0.855); // #E6E3DA

type Fonts = { regular: PDFFont; bold: PDFFont };

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

async function drawSheet(page: PDFPage, doc: PDFDocument, fonts: Fonts, ws: Worksheet, teacher: Teacher, student: Student) {
  const { regular, bold } = fonts;

  // QR top-right: the reader looks there first.
  const qrPng = await QRCode.toBuffer(encodeSheetQr({ worksheetId: ws.id, studentId: student.id }), {
    type: "png",
    margin: 1,
    width: 480,
    errorCorrectionLevel: "M",
  });
  const qr = await doc.embedPng(qrPng);
  const qrSize = 118;
  page.drawImage(qr, { x: PAGE_W - M - qrSize, y: PAGE_H - M - qrSize, width: qrSize, height: qrSize });

  page.drawText(`DAFTAR  ·  ${teacher.subject.toUpperCase()}  ·  ${ws.className} SINF`, {
    x: M, y: PAGE_H - M - 10, size: 9, font: bold, color: SOFT,
  });
  page.drawText(`${ws.topic} — tekshiruv varaqasi`, { x: M, y: PAGE_H - M - 38, size: 20, font: bold, color: INK });
  page.drawText(student.name, { x: M, y: PAGE_H - M - 62, size: 14, font: regular, color: INK });

  // Student number, large enough to sort the stack by hand.
  page.drawText("O'quvchi raqami", { x: M, y: PAGE_H - M - 92, size: 9, font: regular, color: SOFT });
  page.drawText(String(student.number), { x: M, y: PAGE_H - M - 146, size: 56, font: bold, color: INK });

  page.drawText("Javobni faqat katakka yozing. Kasr: 3/4, aralash son: 2 1/3, taqqoslash: > < =", {
    x: M, y: PAGE_H - M - 182, size: 10, font: regular, color: SOFT,
  });
  page.drawLine({
    start: { x: M, y: PAGE_H - M - 196 },
    end: { x: PAGE_W - M, y: PAGE_H - M - 196 },
    thickness: 1,
    color: GRID,
  });

  const boxW = 190;
  const boxH = 72;
  const boxX = PAGE_W - M - boxW;
  const rowH = 104;
  let top = PAGE_H - M - 216;

  for (const q of ws.questions) {
    // Question number + text on the left.
    page.drawText(String(q.n), { x: M, y: top - 30, size: 22, font: bold, color: INK });
    wrap(q.text, regular, 14, boxX - M - 64).forEach((line, i) => {
      page.drawText(line, { x: M + 36, y: top - 28 - i * 18, size: 14, font: regular, color: INK });
    });

    // Thick answer box with its number in the corner, so the reader can match boxes to questions.
    page.drawRectangle({ x: boxX, y: top - boxH, width: boxW, height: boxH, borderColor: INK, borderWidth: 3 });
    page.drawText(String(q.n), { x: boxX + 7, y: top - 15, size: 10, font: bold, color: SOFT });

    top -= rowH;
  }

  page.drawText("Varaqni buklamang va QR-kodni yopmang", {
    x: M, y: M - 8, size: 8, font: regular, color: SOFT,
  });
}

export async function buildWorksheetPdf(ws: Worksheet, teacher: Teacher, students: Student[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${ws.className} · ${ws.topic}`);
  const fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };
  for (const student of students) {
    const page = doc.addPage([PAGE_W, PAGE_H]);
    await drawSheet(page, doc, fonts, ws, teacher, student);
  }
  return doc.save();
}
