// QR payload printed on every worksheet: which sheet and which student.
// Kept tiny so the code stays low-density and easy to read from a phone photo.

export type SheetQr = { worksheetId: string; studentId: string };

export function encodeSheetQr({ worksheetId, studentId }: SheetQr): string {
  return JSON.stringify({ w: worksheetId, s: studentId });
}

export function decodeSheetQr(raw: string): SheetQr | null {
  try {
    const data = JSON.parse(raw) as { w?: unknown; s?: unknown };
    if (typeof data.w === "string" && typeof data.s === "string") {
      return { worksheetId: data.w, studentId: data.s };
    }
  } catch {
    // Not our QR code.
  }
  return null;
}
