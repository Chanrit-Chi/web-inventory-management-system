import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getServerSession } from "@/lib/getServerSession";
import { prisma } from "@/lib/prisma"; // your Prisma client

const f = createUploadthing();

// Auth helper (same as your original)
const auth = async (req: Request) => {
  const session = await getServerSession();
  if (!session) {
    throw new UploadThingError("Unauthorized");
  }
  return { id: session.user.id };
};

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      return await auth(req); // metadata.id will be userId
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const upload = await prisma.upload.create({
        data: {
          key: file.key,
          url: file.ufsUrl,
          status: "TEMP",
          userId: metadata.id,
        },
      });

      console.log("Upload complete for userId:", metadata.id);
      console.log("File URL:", file.ufsUrl);

      return { key: upload.key, url: upload.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
