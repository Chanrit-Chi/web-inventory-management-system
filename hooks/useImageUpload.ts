import { uploadFiles } from "@/utils/uploadthing";
import { useState } from "react";
import { toast } from "sonner";

export function useImageUpload() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageKey, setImageKey] = useState<string | null>(null);

  const uploadImage = async (file: File) => {
    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);
    setUploading(true);

    try {
      const res = await uploadFiles("imageUploader", { files: [file] });
      const uploadedUrl = res?.[0]?.ufsUrl;
      const uploadedKey = res?.[0]?.key;

      if (!uploadedUrl || !uploadedKey) throw new Error("Upload failed");

      setImageKey(uploadedKey);
      URL.revokeObjectURL(localPreview);
      setImagePreview(uploadedUrl);

      return { url: uploadedUrl, key: uploadedKey };
    } catch (err) {
      console.error(err);
      toast.error("Image upload failed");
      setImagePreview(null);
      setImageKey(null);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const resetImage = () => {
    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setImageKey(null);
  };

  return {
    imagePreview,
    uploading,
    imageKey,
    uploadImage,
    resetImage,
    setImagePreview,
  };
}
