import { NextResponse } from "next/server";
import { testConnection } from "@/lib/db/sqlserver";

export async function POST() {
  const result = await testConnection();
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
