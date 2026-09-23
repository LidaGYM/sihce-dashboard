import { NextRequest, NextResponse } from "next/server";
import { importExcelBuffer } from "@/lib/services/excelImport";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Debes adjuntar un archivo Excel (.xlsx)" }, { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await importExcelBuffer(Buffer.from(arrayBuffer));
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido al procesar el archivo";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
