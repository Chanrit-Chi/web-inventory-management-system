import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { key } = await req.json();

  if (!key)
    return NextResponse.json({ error: "No key provided" }, { status: 400 });

  try {
    await prisma.upload.update({
      where: { key },
      data: { status: "CONFIRMED" },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to confirm upload" },
      { status: 500 },
    );
  }
}
