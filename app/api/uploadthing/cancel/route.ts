import { UTApi } from "uploadthing/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const utapi = new UTApi();
  const { key } = await req.json();

  if (!key)
    return NextResponse.json({ error: "No key provided" }, { status: 400 });

  try {
    // Delete the file from UploadThing
    await utapi.deleteFiles([key]);

    // Delete record from your DB
    await prisma.upload.delete({
      where: { key },
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to cancel upload" },
      { status: 500 },
    );
  }
}
