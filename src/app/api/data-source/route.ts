import { NextRequest, NextResponse } from "next/server";
import { getDataSourceMode, setDataSourceMode, getLastImportAt } from "@/lib/services/config";
import { DataSourceMode } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    mode: getDataSourceMode(),
    lastImportAt: getLastImportAt(),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const mode = body?.mode as DataSourceMode;
  if (mode !== "excel" && mode !== "sqlserver") {
    return NextResponse.json({ error: 'mode debe ser "excel" o "sqlserver"' }, { status: 400 });
  }
  setDataSourceMode(mode);
  return NextResponse.json({ mode });
}
