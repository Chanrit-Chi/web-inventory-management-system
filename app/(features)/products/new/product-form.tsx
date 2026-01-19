"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProductMutations } from "@/hooks/useProduct";
import { ProductCreateSchema } from "@/schemas/product.schema";
import { ProductCreate } from "@/schemas/type-export.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { uploadFiles } from "@/utils/uploadthing";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetCategories } from "@/hooks/useCategory";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { CreateCategoryDialog } from "../category/all-categories/category-dialogs";
import { useDropzone } from "react-dropzone";
import Image from "next/image";

export default function ProductSectionForm() {
  const { addProduct } = useProductMutations();
  const categories = useGetCategories();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [openCreateCategory, setOpenCreateCategory] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageKey, setImageKey] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(ProductCreateSchema),
    defaultValues: {
      name: "",
      sku: "",
      description: "",
      unit: "",
      categoryId: 0,
      image: null,
    },
  });

  const onSubmit = async (data: ProductCreate) => {
    try {
      await addProduct.mutateAsync(data);
      if (imageKey) {
        await fetch("/api/uploadthing/confirm", {
          method: "POST",
          body: JSON.stringify({ key: imageKey }),
          headers: { "Content-Type": "application/json" },
        });
      }
      toast.success("Product added successfully");
      reset();
      setImagePreview(null);
      setImageKey(null);
    } catch (error) {
      toast.error("Failed to add product");
      console.error("Failed to add product:", error);
    }
  };

  const handleCancel = async () => {
    if (imageKey) {
      try {
        await fetch("/api/uploadthing/cancel", {
          method: "POST",
          body: JSON.stringify({ key: imageKey }),
          headers: { "Content-Type": "application/json" },
        });
        toast.info("Upload cancelled");
      } catch (error) {
        console.error("Failed to cancel upload:", error);
      }
    }
    reset();
    setImagePreview(null);
    setImageKey(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    multiple: false,
    onDrop: (acceptedFiles) => {
      (async () => {
        const file = acceptedFiles[0];
        if (!file) return;

        const localPreview = URL.createObjectURL(file);
        setImagePreview(localPreview);
        setUploading(true);

        try {
          const res = await uploadFiles("imageUploader", {
            files: [file],
          });

          const uploadedUrl = res?.[0]?.ufsUrl;
          const uploadedKey = res?.[0]?.key;

          if (!uploadedUrl || !uploadedKey) throw new Error("Upload failed");

          // store the key for two-phase upload
          setImageKey(uploadedKey);

          URL.revokeObjectURL(localPreview);
          setImagePreview(uploadedUrl);

          // save URL to react-hook-form
          setValue("image", uploadedUrl, {
            shouldValidate: true,
            shouldDirty: true,
          });
        } catch (err) {
          console.error(err);
          toast.error("Image upload failed");
          setImagePreview(null);
          setImageKey(null);
          setValue("image", null);
        } finally {
          setUploading(false);
        }
      })();
    },
  });

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  useEffect(() => {
    if (selectedCategory) {
      setValue("categoryId", Number(selectedCategory), {
        shouldValidate: true,
      });
    }
  }, [selectedCategory, setValue]);

  return (
    <Accordion
      type="single"
      collapsible
      className="w-full"
      defaultValue="productInformation"
    >
      <AccordionItem value="productInformation" className="p-4 m-4">
        <div className="border rounded-lg p-4">
          <AccordionTrigger>Product Information</AccordionTrigger>
          <AccordionContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              {
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  <div className="flex flex-col p-2">
                    <Label className="mb-2">
                      SKU <span className="text-red-500">*</span>
                    </Label>
                    <Input type="text" {...register("sku")} />
                    {errors.sku && (
                      <p className="text-red-500">{errors.sku.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col p-2">
                    <Label className="mb-2">
                      Product Name <span className="text-red-500">*</span>
                    </Label>
                    <Input type="text" {...register("name")} />
                    {errors.name && (
                      <p className="text-red-500">{errors.name.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col p-2">
                    <Label className="mb-2">
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <Input type="text" {...register("description")} />
                    {errors.description && (
                      <p className="text-red-500">
                        {errors.description.message}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col p-2">
                    <Label className="mb-2">
                      Unit <span className="text-red-500">*</span>
                    </Label>
                    <Input type="text" {...register("unit")} />
                    {errors.unit && (
                      <p className="text-red-500">{errors.unit.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col p-2">
                    <Label className="mb-2">
                      Category <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex flex-row items-center gap-2">
                      <Select
                        value={selectedCategory}
                        onValueChange={setSelectedCategory}
                      >
                        <SelectTrigger className="w-45">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Categories</SelectLabel>
                            {categories.data?.map((category) => (
                              <SelectItem
                                key={category.id}
                                value={category.id.toString()}
                              >
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        onClick={() => setOpenCreateCategory(true)}
                      >
                        Add Category
                      </Button>
                      <CreateCategoryDialog
                        open={openCreateCategory}
                        onOpenChange={setOpenCreateCategory}
                      />
                    </div>
                    {errors.categoryId && (
                      <p className="text-red-500">
                        {errors.categoryId.message}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col p-2">
                    <Label className="mb-2">
                      Active Status <span className="text-red-500">*</span>
                    </Label>
                    <Select defaultValue="true" {...register("isActive")}>
                      <SelectTrigger className="w-45">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Status</SelectLabel>
                          <SelectItem value="true">ACTIVE</SelectItem>
                          <SelectItem value="false">INACTIVE</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {errors.isActive && (
                      <p className="text-red-500">{errors.isActive.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col p-2">
                    <Label className="mb-2">Product Image</Label>

                    <div
                      {...getRootProps()}
                      className={`border-dashed border-2 p-6 rounded-lg text-center cursor-pointer transition
        ${isDragActive ? "border-blue-500" : "border-gray-300"}`}
                    >
                      <input {...getInputProps()} />

                      {uploading && (
                        <p className="text-sm text-muted-foreground">
                          Uploading image…
                        </p>
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
                    {errors.image && (
                      <p className="text-red-500 text-sm">
                        {errors.image.message}
                      </p>
                    )}
                  </div>
                </div>
              }
              {/* Submit button */}
              <div className="mt-4 items-end flex justify-end">
                <Button
                  type="submit"
                  disabled={addProduct.isPending}
                  className="cursor-pointer"
                >
                  {addProduct.isPending ? "Saving..." : "Save Product"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="ml-2 cursor-pointer hover:bg-gray-100"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </AccordionContent>
        </div>
      </AccordionItem>
    </Accordion>
  );
}
