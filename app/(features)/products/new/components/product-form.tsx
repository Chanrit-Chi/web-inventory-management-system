"use client";

import { Input } from "@/components/ui/input";
import { useProductMutations } from "@/hooks/useProduct";
import { useGetAttributes } from "@/hooks/useAttribute";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
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
import {
  ProductWithVariantsCommandSchema,
  ProductWithVariantsCommand,
} from "@/schemas/commands/product-with-variants.command";
import { AlertCircle } from "lucide-react";

export default function ProductForm() {
  const { addProduct } = useProductMutations();
  const categories = useGetCategories();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [openCreateCategory, setOpenCreateCategory] = useState(false);
  const { imagePreview, uploading, uploadImage, resetImage, imageKey } =
    useImageUpload();
  const attributes = useGetAttributes();
  const [selectedAttributes, setSelectedAttributes] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const method = useForm({
    resolver: zodResolver(ProductWithVariantsCommandSchema),
    defaultValues: {
      name: "",
      sku: "",
      description: "",
      unit: "",
      categoryId: undefined,
      image: null,
      isActive: "ACTIVE",
      attributeIds: [],
      variants: [],
    },
    mode: "onBlur",
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch,
  } = method;

  const variants = watch("variants");

  const onSubmit = async (data: ProductWithVariantsCommand) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        categoryId: Number(data.categoryId),
        attributeIds: selectedAttributes,
      };

      await addProduct.mutateAsync(payload);

      if (imageKey) {
        await confirmImageUpload(imageKey);
      }

      toast.success("Product added successfully");
      resetForm();
    } catch (error) {
      toast.error("Failed to add product");
      console.error("Failed to add product:", error);

      if (imageKey) {
        await cancelImageUpload(imageKey);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    reset();
    resetImage();
    setSelectedCategory("");
    setSelectedAttributes([]);
  };

  const handleCancel = async () => {
    if (
      isDirty &&
      !confirm("You have unsaved changes. Are you sure you want to cancel?")
    ) {
      return;
    }

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
      toast.error("Failed to upload image");
    }
  };

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

  useEffect(() => {
    setValue("attributeIds", selectedAttributes, { shouldValidate: true });
  }, [selectedAttributes, setValue]);

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="w-full pb-8">
      <FormProvider {...method}>
        <div className="space-y-6">
          {/* Error Summary */}
          {hasErrors && (
            <div className="mx-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">
                  Please fix the following errors:
                </h3>
                <ul className="text-sm text-red-700 space-y-1">
                  {Object.entries(errors).map(([key, error]) => (
                    <li key={key}>• {error?.message?.toString()}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Product Information */}
          <section className="mx-4 p-6 border rounded-lg bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-6 text-gray-900">
              Product Information
            </h2>

            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <FormField label="SKU" required error={errors.sku?.message}>
                <Input
                  type="text"
                  {...register("sku")}
                  placeholder="e.g., PROD-001"
                  className={errors.sku ? "border-red-500" : ""}
                />
              </FormField>

              <FormField
                label="Product Name"
                required
                error={errors.name?.message}
              >
                <Input
                  type="text"
                  {...register("name")}
                  placeholder="Enter product name"
                  className={errors.name ? "border-red-500" : ""}
                />
              </FormField>

              <FormField
                label="Description"
                required
                error={errors.description?.message}
              >
                <Input
                  type="text"
                  {...register("description")}
                  placeholder="Brief description"
                  className={errors.description ? "border-red-500" : ""}
                />
              </FormField>

              <FormField label="Unit" required error={errors.unit?.message}>
                <Input
                  type="text"
                  {...register("unit")}
                  placeholder="e.g., pcs, kg, liters"
                  className={errors.unit ? "border-red-500" : ""}
                />
              </FormField>

              <FormField
                label="Category"
                required
                error={errors.categoryId?.message}
              >
                <div className="flex gap-2">
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger
                      className={`flex-1 ${errors.categoryId ? "border-red-500" : ""}`}
                    >
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
                    variant="outline"
                    onClick={() => setOpenCreateCategory(true)}
                    className="whitespace-nowrap"
                  >
                    Add New
                  </Button>
                </div>
              </FormField>

              <FormField
                label="Active Status"
                required
                error={errors.isActive?.message}
              >
                <Select
                  value={watch("isActive")}
                  onValueChange={(value) => {
                    if (value === "ACTIVE" || value === "INACTIVE") {
                      setValue("isActive", value, { shouldValidate: true });
                    }
                  }}
                >
                  <SelectTrigger
                    className={errors.isActive ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Status</SelectLabel>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormField>

              <div className="md:col-span-2 lg:col-span-3">
                <FormField
                  label="Attributes"
                  error={errors.attributeIds?.message}
                >
                  {attributes.data && attributes.data.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {attributes.data.map(
                        (attr: { id: number; name: string }) => (
                          <label
                            key={attr.id}
                            className="flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <input
                              type="checkbox"
                              value={attr.id}
                              checked={selectedAttributes.includes(attr.id)}
                              onChange={(e) => {
                                const id = Number(e.target.value);
                                setSelectedAttributes((prev) =>
                                  e.target.checked
                                    ? [...prev, id]
                                    : prev.filter((a) => a !== id),
                                );
                              }}
                              className="w-4 h-4"
                            />
                            <span className="text-sm font-medium">
                              {attr.name}
                            </span>
                          </label>
                        ),
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No attributes available
                    </p>
                  )}
                </FormField>
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <FormField label="Product Image" error={errors.image?.message}>
                  <ImageDropzone
                    onImageUpload={handleImageUpload}
                    imagePreview={imagePreview}
                    uploading={uploading}
                    error={errors.image?.message}
                  />
                </FormField>
              </div>
            </div>
          </section>

          {/* Variants Section */}
          <section className="mx-4 p-6 border rounded-lg bg-white shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Pricing and Stock
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {variants?.length > 0
                    ? `${variants.length} variant${variants.length > 1 ? "s" : ""} configured`
                    : "Add variants to specify pricing and stock levels"}
                </p>
              </div>
            </div>
            <VariantForm attributes={attributes.data || []} />
          </section>

          {/* Supplier Section */}
          <section className="mx-4 p-6 border rounded-lg bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              Supplier
            </h2>
            <div className="text-sm text-gray-500 italic">
              Supplier details section is under construction.
            </div>
          </section>

          {/* Form Actions */}
          <div className="mx-4 flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting || uploading}
              className="min-w-[120px]"
            >
              {isSubmitting ? "Saving..." : "Save Product"}
            </Button>
          </div>
        </div>
      </FormProvider>

      <CreateCategoryDialog
        open={openCreateCategory}
        onOpenChange={setOpenCreateCategory}
      />
    </div>
  );
}
