"use client";

import { useGetProductById } from "@/hooks/useProduct";
import { useParams, useRouter } from "next/navigation";
import ProductForm, {
  ProductFormValues,
} from "../../new/components/product-form";
import { Spinner } from "@/components/ui/spinner";
import { SharedLayout } from "@/components/shared-layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: product, isLoading, error } = useGetProductById(id as string);

  if (isLoading) {
    return (
      <SharedLayout>
        <div className="flex h-100 w-full items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      </SharedLayout>
    );
  }

  if (error || !product) {
    return (
      <SharedLayout>
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
          <h2 className="text-xl font-bold text-red-600">
            Error: {error?.message || "Product not found"}
          </h2>
          <Button
            variant="outline"
            onClick={() => router.push("/products/product-list")}
          >
            Back to Product List
          </Button>
        </div>
      </SharedLayout>
    );
  }

  // Map product with its nested data to the form expected format
  const productWithSelections = product as unknown as ProductFormValues;

  const initialData: Partial<ProductFormValues> = {
    ...product,
    attributeSelections: productWithSelections.attributeSelections || [],
    variants: productWithSelections.variants || [],
  };

  return (
    <SharedLayout>
      <div className="w-full px-4 md:px-6 py-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/products/product-list")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Edit Product</h1>
          </div>
        </div>

        <ProductForm
          initialData={initialData}
          isEdit={true}
          productId={id as string}
        />
      </div>
    </SharedLayout>
  );
}
