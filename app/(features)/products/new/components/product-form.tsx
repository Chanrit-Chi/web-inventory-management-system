"use client";

import { Input } from "@/components/ui/input";
import { useProductMutations } from "@/hooks/useProduct";
import { ProductCreateSchema } from "@/schemas/product.schema";
import { ProductCreate } from "@/schemas/type-export.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { CreateCategoryDialog } from "../../category/all-categories/category-dialogs";
import { useImageUpload } from "@/hooks/useImageUpload";
import { ImageDropzone } from "@/components/ImageDropzone";
import { FormField } from "@/components/FormField";
import { VariantForm } from "./variant-form";

export default function ProductSectionForm() {
  const { addProduct } = useProductMutations();
  const categories = useGetCategories();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [openCreateCategory, setOpenCreateCategory] = useState(false);
  const { imagePreview, uploading, uploadImage, resetImage, imageKey } =
    useImageUpload();

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

      // Confirm upload only after successful product creation
      if (imageKey) {
        await confirmImageUpload(imageKey);
      }

      toast.success("Product added successfully");
      resetForm();
    } catch (error) {
      toast.error("Failed to add product");
      console.error("Failed to add product:", error);

      // Cancel upload if product creation failed
      if (imageKey) {
        await cancelImageUpload(imageKey);
      }
    }
  };

  const resetForm = () => {
    reset();
    resetImage();
  };

  const handleCancel = async () => {
    if (imageKey) {
      await cancelImageUpload(imageKey);
    }
    resetForm();
  };

  const handleImageUpload = async (file: File) => {
    try {
      const { url } = await uploadImage(file);
      setValue("image", url, { shouldValidate: true });
    } catch (error) {
      console.error("Image upload failed:", error);
    }
  };

  // Helper functions
  const confirmImageUpload = async (key: string) => {
    await fetch("/api/uploadthing/confirm", {
      method: "POST",
      body: JSON.stringify({ key }),
      headers: { "Content-Type": "application/json" },
    });
  };

  const cancelImageUpload = async (key: string) => {
    try {
      await fetch("/api/uploadthing/cancel", {
        method: "POST",
        body: JSON.stringify({ key }),
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Failed to cancel upload:", error);
    }
  };

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
    <div className="w-full space-y-6">
      {/* Product Information */}
      <section className="p-4 m-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Product Information</h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <FormField label="SKU" required error={errors.sku?.message}>
              <Input type="text" {...register("sku")} />
            </FormField>

            <FormField
              label="Product Name"
              required
              error={errors.name?.message}
            >
              <Input type="text" {...register("name")} />
            </FormField>

            <FormField
              label="Description"
              required
              error={errors.description?.message}
            >
              <Input type="text" {...register("description")} />
            </FormField>

            <FormField label="Unit" required error={errors.unit?.message}>
              <Input type="text" {...register("unit")} />
            </FormField>

            <FormField
              label="Category"
              required
              error={errors.categoryId?.message}
            >
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
            </FormField>

            <FormField
              label="Active Status"
              required
              error={errors.isActive?.message}
            >
              <Select
                defaultValue="true"
                onValueChange={(value) =>
                  setValue(
                    "isActive",
                    value === "ACTIVE" ? "ACTIVE" : "INACTIVE",
                  )
                }
              >
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
            </FormField>

            <FormField label="Product Image" error={errors.image?.message}>
              <ImageDropzone
                onImageUpload={handleImageUpload}
                imagePreview={imagePreview}
                uploading={uploading}
                error={errors.image?.message}
              />
            </FormField>
          </div>

          <div className="mt-4 flex justify-end">
            <Button type="submit" disabled={addProduct.isPending}>
              {addProduct.isPending ? "Saving..." : "Save Product"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="ml-2"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        </form>
      </section>

      {/* Pricing and Stocks */}
      <section className="p-4 m-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Pricing and Stocks</h2>

        <VariantForm />
      </section>

      {/* Supplier */}
      <section className="p-4 m-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Supplier</h2>

        <div className="text-sm text-gray-500">
          Additional details section is under construction.
        </div>
      </section>
    </div>
  );
}
