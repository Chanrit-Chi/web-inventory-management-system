import Image from "next/image";
import { useDropzone } from "react-dropzone";

interface ImageDropzoneProps {
  readonly onImageUpload: (file: File) => Promise<void>;
  readonly imagePreview: string | null;
  readonly uploading: boolean;
  readonly error?: string;
}

export function ImageDropzone({
  onImageUpload,
  imagePreview,
  uploading,
  error,
}: ImageDropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    multiple: false,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) onImageUpload(file);
    },
  });

  return (
    <div className="flex flex-col p-2">
      <div
        {...getRootProps()}
        className={`border-dashed border-2 p-6 rounded-lg text-center cursor-pointer transition
          ${isDragActive ? "border-blue-500" : "border-gray-300"}`}
      >
        <input {...getInputProps()} />
        {uploading && (
          <p className="text-sm text-muted-foreground">Uploading image…</p>
        )}
        {!uploading && imagePreview && (
          <div className="flex justify-center">
            <Image
              src={imagePreview}
              alt="Product preview"
              width={200}
              height={200}
              className="rounded-md object-cover"
            />
          </div>
        )}
        {!uploading && !imagePreview && (
          <p className="text-sm text-muted-foreground">
            Drag & drop image, or click to upload
          </p>
        )}
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
