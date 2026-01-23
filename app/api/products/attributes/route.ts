import { NextResponse } from "next/server";
import { attributeDbService } from "@/lib/services/db/attributeDbService";

export async function GET() {
  const attributes = await attributeDbService.fetchAttributes();
  return NextResponse.json(attributes);
}
