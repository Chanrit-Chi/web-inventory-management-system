import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UTApi } from "uploadthing/server";

// this won't be called via client-side code need server-side only
export async function GET() {
  const utapi = new UTApi();
  const oldTempFiles = await prisma.upload.findMany({
    where: {
      status: "TEMP",
      createdAt: { lt: new Date(Date.now() - 1000 * 60 * 60) }, // 1 hour old
    },
  });

  for (const file of oldTempFiles) {
    try {
      await utapi.deleteFiles([file.key]);
      await prisma.upload.delete({ where: { key: file.key } });
    } catch (err) {
      console.error("Failed to delete orphan file", file.key, err);
    }
  }

  return NextResponse.json({ deleted: oldTempFiles.length });
}
