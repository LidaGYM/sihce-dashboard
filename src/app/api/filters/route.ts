import { NextResponse } from "next/server";
import { getFilters } from "@/lib/services/modulesService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getFilters();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
