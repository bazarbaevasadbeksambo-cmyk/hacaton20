import { buildWorksheetPdf } from "@/lib/pdf/worksheet-pdf";
import { getStudent, students, teacher, worksheet } from "@/lib/data";

// GET — PDF for the whole class; ?studentId=… — one page (used for the preview).
export async function GET(request: Request) {
  const studentId = new URL(request.url).searchParams.get("studentId");
  const one = studentId ? getStudent(studentId) : undefined;
  if (studentId && !one) return Response.json({ error: "O'quvchi topilmadi" }, { status: 404 });

  const pdf = await buildWorksheetPdf(worksheet, teacher, one ? [one] : students);
  const filename = one ? `daftar-${worksheet.className}-${one.number}.pdf` : `daftar-${worksheet.className}-kasrlar.pdf`;

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${one ? "inline" : "attachment"}; filename="${filename}"`,
    },
  });
}
