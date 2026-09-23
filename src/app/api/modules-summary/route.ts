import { NextRequest, NextResponse } from "next/server";
import { getModulesSummary } from "@/lib/services/modulesService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const periodo = req.nextUrl.searchParams.get("periodo");
  if (!periodo) {
    return NextResponse.json({ error: "Falta el parametro periodo" }, { status: 400 });
  }
  const categoria = req.nextUrl.searchParams.get("categoria") ?? undefined;
  const ipress = req.nextUrl.searchParams.get("ipress") ?? undefined;

  try {
    const data = await getModulesSummary({ periodo, categoria, ipress });
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
