import { NextRequest, NextResponse } from "next/server";
import { productDbService } from "@/lib/services/db/productDbService";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

    if (data.length === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }

    const results = await productDbService.importProducts(data);

    return NextResponse.json(results);
  } catch (error: unknown) {
    console.error("Import error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
