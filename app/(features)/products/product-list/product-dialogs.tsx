import {
  Product,
  ProductUpdate,
  ProductVariant,
  Category,
} from "@/schemas/type-export.schema";
import { useProductMutations, useGetProductById } from "@/hooks/useProduct";
import { ProductUpdateSchema } from "@/schemas/product.schema";
import { toast } from "sonner";

import {
  ConfirmDialog,
  FormDialog,
  ViewDialog,
} from "@/components/dialog-template";

// Type for product with variants (from API response)
export type ProductWithVariants = Product & {
  variants?: ProductVariant[];
  category?: Category | null;
  unit?: string | null;
};

// View Product Dialog
export function ViewProductDialog({
  product,
  open,
  onOpenChange,
}: {
  readonly product: ProductWithVariants;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  return (
    <ViewDialog<ProductWithVariants>
      open={open}
      onOpenChange={onOpenChange}
      title="View Product"
      description="Product details and information"
      item={product}
      className="sm:max-w-[600px]"
      fields={[
        {
          label: "SKU",
          value: (prod) => prod.sku,
        },
        {
          label: "Name",
          value: (prod) => prod.name,
        },
        {
          label: "Description",
          value: (prod) => prod.description || "No description",
        },
        {
          label: "Category",
          value: (prod) => prod.category?.name || "N/A",
        },
        {
          label: "Unit",
          value: (prod) => prod.unit || "N/A",
        },
        {
          label: "Status",
          value: (prod) => (
            <span
              className={`px-2 py-1 rounded text-sm font-medium ${
                prod.isActive === "ACTIVE"
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {prod.isActive === "ACTIVE" ? "Active" : "Inactive"}
            </span>
          ),
        },
        {
          label: "Total Variants",
          value: (prod) => prod.variants?.length || 0,
        },
        {
          label: "Total Stock",
          value: (prod) =>
            prod.variants?.reduce(
              (sum: number, v) => sum + (v.stock || 0),
              0,
            ) || 0,
        },
        {
          label: "Created At",
          value: (prod) => new Date(prod.createdAt).toLocaleString(),
        },
        {
          label: "Updated At",
          value: (prod) => new Date(prod.updatedAt).toLocaleString(),
        },
      ]}
    />
  );
}

// Update Product Dialog - Simple version for basic fields
export function UpdateProductDialog({
  product,
  open,
  onOpenChange,
}: {
  readonly product: ProductWithVariants;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const { updateProduct } = useProductMutations();
  const { data: productData } = useGetProductById(product.id);

  const handleSubmit = async (data: ProductUpdate) => {
    try {
      await updateProduct.mutateAsync({ id: product.id, data });
      toast.success("Product updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update product");
      console.error(error);
    }
  };

  return (
    <FormDialog<typeof ProductUpdateSchema>
      open={open}
      onOpenChange={onOpenChange}
      title="Quick Update Product"
      description="Update basic product information. For advanced editing, use the full edit page."
      schema={ProductUpdateSchema}
      className="sm:max-w-[500px]"
      fields={[
        {
          name: "name",
          label: "Product Name",
          placeholder: "Enter product name",
          required: true,
        },
        {
          name: "description",
          label: "Description",
          placeholder: "Enter product description",
          type: "textarea",
          rows: 3,
        },
        {
          name: "sku",
          label: "SKU",
          placeholder: "Enter SKU",
          required: true,
        },
      ]}
      defaultValues={{
        name: productData?.name || product.name,
        description: productData?.description || product.description || "",
        sku: productData?.sku || product.sku,
      }}
      onSubmit={handleSubmit}
      submitLabel="Update"
      isSubmitting={updateProduct.isPending}
    />
  );
}

// Delete Product Dialog
export function DeleteProductDialog({
  product,
  open,
  onOpenChange,
}: {
  readonly product: ProductWithVariants;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const { deleteProduct } = useProductMutations();

  const handleDelete = async () => {
    try {
      await deleteProduct.mutateAsync(product.id);
      toast.success("Product deactivated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to deactivate product");
      console.error(error);
    }
  };

  return (
    <ConfirmDialog<ProductWithVariants>
      open={open}
      onOpenChange={onOpenChange}
      title="Deactivate Product"
      description="Are you sure you want to deactivate this product? This will mark the product and all its variants as inactive."
      item={product}
      renderItem={(prod) => (
        <div className="rounded-lg bg-muted p-4 space-y-2">
          <div>
            <p className="text-sm font-semibold">
              Product Name: <span className="font-normal">{prod.name}</span>
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">
              SKU: <span className="font-normal">{prod.sku}</span>
            </p>
          </div>
          {prod.category && (
            <div>
              <p className="text-sm font-semibold">
                Category:{" "}
                <span className="font-normal">{prod.category.name}</span>
              </p>
            </div>
          )}
          <div>
            <p className="text-sm font-semibold">
              Total Variants:{" "}
              <span className="font-normal">{prod.variants?.length || 0}</span>
            </p>
          </div>
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
            <p className="text-xs text-blue-800">
              ℹ️ Note: Deactivating this product will also mark all{" "}
              {prod.variants?.length || 0} variant(s) as inactive.
            </p>
          </div>
        </div>
      )}
      onConfirm={handleDelete}
      confirmLabel="Deactivate"
      isLoading={deleteProduct.isPending}
    />
  );
}
