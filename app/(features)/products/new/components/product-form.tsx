"use client";

import { Input } from "@/components/ui/input";
import { useProductMutations } from "@/hooks/useProduct";
import { ProductCreateSchema } from "@/schemas/product.schema"; // Keep this import for ProductFormSchema
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  FormProvider,
  useForm,
  Controller,
  SubmitHandler,
  Resolver,
} from "react-hook-form";
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
import { useGetUnits } from "@/hooks/useUnit";
import { CreateUnitDialog } from "../../unit/unit-dialogs";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";

const ProductFormSchema = ProductCreateSchema.extend({
  attributeSelections: z.array(
    z.object({
      attributeId: z.number(),
      attributeName: z.string(),
      selectedValueIds: z.array(z.number()),
      values: z.array(
        z.object({
          id: z.number(),
          value: z.string(),
        }),
      ),
    }),
  ),
});

export type ProductFormValues = z.infer<typeof ProductFormSchema>;

export default function ProductForm({
  initialData,
  isEdit = false,
  productId,
}: {
  readonly initialData?: Partial<ProductFormValues>;
  readonly isEdit?: boolean;
  readonly productId?: string;
}) {
  const { addProduct, updateProduct } = useProductMutations();
  const categories = useGetCategories();
  const units = useGetUnits();
  const [openCreateCategory, setOpenCreateCategory] = useState(false);
  const [openCreateUnit, setOpenCreateUnit] = useState(false);
  const {
    imagePreview,
    uploading,
    uploadImage,
    resetImage,
    imageKey,
    setImagePreview,
  } = useImageUpload();

  const method = useForm<ProductFormValues>({
    resolver: zodResolver(ProductFormSchema) as Resolver<ProductFormValues>,
    defaultValues: {
      name: initialData?.name || "",
      sku: initialData?.sku || "",
      description: initialData?.description || "",
      unitId: initialData?.unitId || 0,
      categoryId: initialData?.categoryId || 0,
      isActive: initialData?.isActive || "ACTIVE",
      image: initialData?.image || null,
      variants: initialData?.variants || [],
      attributeSelections: initialData?.attributeSelections || [],
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = method;

  // Pre-fill fields when initialData changes (useful for async loading)
  useEffect(() => {
    if (!initialData) return;
    const {
      name,
      sku,
      description,
      image,
      isActive,
      categoryId,
      unitId,
      variants,
      attributeSelections,
    } = initialData;

    if (name) setValue("name", name);
    if (sku) setValue("sku", sku);
    if (description) setValue("description", description);

    if (image) {
      setValue("image", image);
      setImagePreview(image);
    }

    if (isActive !== undefined) setValue("isActive", isActive);
    if (categoryId) setValue("categoryId", categoryId);
    if (unitId) setValue("unitId", unitId);
    if (variants) setValue("variants", variants);
    if (attributeSelections)
      setValue("attributeSelections", attributeSelections);
  }, [initialData, setValue, setImagePreview]);

  const onSubmit: SubmitHandler<ProductFormValues> = async (data) => {
    try {
      const { attributeSelections, ...productData } = data;

      if (isEdit && productId) {
        await updateProduct.mutateAsync({
          id: productId,
          data: productData,
        });
        toast.success("Product updated successfully");
      } else {
        await addProduct.mutateAsync({
          productData,
          attributeSelections: attributeSelections || [],
        });

        // Confirm upload only after successful product creation
        if (imageKey) {
          await confirmImageUpload(imageKey);
        }

        toast.success("Product added successfully");
        resetForm();
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : `Failed to ${checkEdit}`,
      );
      console.error(`Failed to ${checkEdit} product:`, error);

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

  const router = useRouter();
  const back = () => {
    router.push("/products/product-list");
  };
  const cancel = () => {
    router.back();
  };

  const handleCancel = async () => {
    if (imageKey) {
      await cancelImageUpload(imageKey);
    }
    resetForm();
    if (isEdit) {
      back();
    } else {
      cancel();
    }
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

  const isPending = addProduct.isPending || updateProduct.isPending;
  const checkEdit = isEdit ? "Update Product" : "Save Product";
  const submitButtonText = isPending ? "Saving..." : checkEdit;

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 py-6">
      <div className="space-y-6">
        {/* Product Information Section */}
        <section className="rounded-lg border p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-4">Product Information</h2>
          <FormProvider {...method}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Info Grid */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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

                <FormField label="Unit" required error={errors.unitId?.message}>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Controller
                      name="unitId"
                      control={method.control}
                      render={({ field }) => (
                        <Select
                          value={field.value?.toString()}
                          onValueChange={(val) => field.onChange(Number(val))}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Units</SelectLabel>
                              {units.data?.map((unit) => (
                                <SelectItem
                                  key={unit.id}
                                  value={unit.id.toString()}
                                >
                                  {unit.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      )}
                    />

                    <Button
                      type="button"
                      onClick={() => setOpenCreateUnit(true)}
                      className="w-full sm:w-auto"
                    >
                      Add Unit
                    </Button>

                    <CreateUnitDialog
                      open={openCreateUnit}
                      onOpenChange={setOpenCreateUnit}
                    />
                  </div>
                </FormField>

                <FormField
                  label="Category"
                  required
                  error={errors.categoryId?.message}
                >
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Controller
                      name="categoryId"
                      control={method.control}
                      render={({ field }) => (
                        <Select
                          value={field.value?.toString()}
                          onValueChange={(val) => field.onChange(Number(val))}
                        >
                          <SelectTrigger className="flex-1">
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
                      )}
                    />

                    <Button
                      type="button"
                      onClick={() => setOpenCreateCategory(true)}
                      className="w-full sm:w-auto"
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
                  <Controller
                    name="isActive"
                    control={method.control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Status</SelectLabel>
                            <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                            <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>
              </div>

              {/* Image Upload - Full Width */}
              <div className="w-full">
                <FormField label="Product Image" error={errors.image?.message}>
                  <ImageDropzone
                    onImageUpload={handleImageUpload}
                    imagePreview={imagePreview}
                    uploading={uploading}
                    error={errors.image?.message}
                  />
                </FormField>
              </div>

              <Separator className="my-6" />

              {/* Pricing and Stocks Section */}
              <section>
                <h2 className="text-lg font-semibold mb-4">
                  Pricing and Stocks
                </h2>
                <VariantForm />
              </section>

              <Separator className="my-6" />

              {/* Supplier Section */}
              <section>
                <h2 className="text-lg font-semibold mb-4">Supplier</h2>
                <div className="text-sm text-gray-500">
                  Additional details section is under construction.
                </div>
              </section>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="w-full sm:w-auto"
                >
                  {isEdit ? "Back" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full sm:w-auto"
                >
                  {submitButtonText}
                </Button>
              </div>
            </form>
          </FormProvider>
        </section>
      </div>
    </div>
  );
}
