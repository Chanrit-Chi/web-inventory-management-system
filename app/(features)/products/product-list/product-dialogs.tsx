import {
  Product,
  ProductVariant,
  Category,
} from "@/schemas/type-export.schema";
import { useProductMutations } from "@/hooks/useProduct";
import { usePermission } from "@/hooks/usePermission";
import { toast } from "sonner";
import {
  Package,
  Tag,
  Calendar,
  AlertCircle,
  Info,
  TrendingUp,
  Hash,
  FileText,
  Layers,
  CheckCircle2,
  XCircle,
  BarChart3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { ConfirmDialog, ViewDialog } from "@/components/dialog-template";

// Type for product with variants (from API response)
export type ProductWithVariants = Product & {
  variants?: ProductVariant[];
  category?: Category | null;
  unit?: string | null;
};

function ProductStatsHeader({
  product,
}: {
  readonly product: ProductWithVariants;
}) {
  const totalStock =
    product.variants?.reduce((sum: number, v) => sum + (v.stock || 0), 0) || 0;
  const activeVariants =
    product.variants?.filter((v) => v.isActive).length || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 -mt-2">
      {/* Total Variants Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              Total Variants
            </p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-200 mt-1">
              {product.variants?.length || 0}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {activeVariants} active
            </p>
          </div>
          <Layers className="h-8 w-8 text-blue-500 dark:text-blue-400 opacity-60" />
        </div>
      </div>

      {/* Total Stock Card */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/40 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
              Total Stock
            </p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-200 mt-1">
              {totalStock}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              {product.unit || "units"}
            </p>
          </div>
          <Package className="h-8 w-8 text-green-500 dark:text-green-400 opacity-60" />
        </div>
      </div>

      {/* Status Card */}
      <div
        className={`rounded-lg p-4 border ${
          product.isActive === "ACTIVE"
            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/40"
            : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/40"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p
              className={`text-xs font-medium uppercase tracking-wide ${
                product.isActive === "ACTIVE"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              Status
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${
                product.isActive === "ACTIVE"
                  ? "text-emerald-900 dark:text-emerald-200"
                  : "text-red-900 dark:text-red-200"
              }`}
            >
              {product.isActive === "ACTIVE" ? "Active" : "Inactive"}
            </p>
          </div>
          {product.isActive === "ACTIVE" ? (
            <CheckCircle2 className="h-8 w-8 text-emerald-500 dark:text-emerald-400 opacity-60" />
          ) : (
            <XCircle className="h-8 w-8 text-red-500 dark:text-red-400 opacity-60" />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Renders a stock overview card with low stock warnings
 */
function StockOverviewDisplay({
  product,
}: {
  readonly product: ProductWithVariants;
}) {
  const totalStock =
    product.variants?.reduce((sum: number, v) => sum + (v.stock || 0), 0) || 0;
  const lowStockVariants =
    product.variants?.filter((v) => (v.stock || 0) < 10).length || 0;

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-blue-900 dark:text-blue-200">
          Total Stock Across All Variants
        </span>
        <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-blue-900 dark:text-blue-200">
          {totalStock}
        </span>
        <span className="text-sm text-blue-600 dark:text-blue-400">
          {product.unit || "units"}
        </span>
      </div>
      {lowStockVariants > 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded px-2 py-1">
          <AlertCircle className="h-3 w-3" />
          <span>
            {lowStockVariants} variant{lowStockVariants === 1 ? "" : "s"} with
            low stock (&lt;10 units)
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Standard info field with icon
 */
function ProductField({
  icon: Icon,
  value,
  className = "text-foreground",
}: {
  readonly icon: React.ElementType;
  readonly value: React.ReactNode;
  readonly className?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className={`font-medium ${className}`}>{value}</span>
    </div>
  );
}

function ProductSummaryCard({
  product,
}: {
  readonly product: ProductWithVariants;
}) {
  const totalStock =
    product.variants?.reduce((sum: number, v) => sum + (v.stock || 0), 0) || 0;

  return (
    <div className="rounded-lg bg-muted/30 border border-border p-5 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-border">
        <div>
          <p className="text-base font-bold text-foreground">{product.name}</p>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            SKU: {product.sku}
          </p>
        </div>
        <Package className="h-8 w-8 text-muted-foreground" />
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Category */}
        <div className="bg-background/50 rounded-lg p-3 border border-border">
          <p className="text-xs text-muted-foreground font-medium mb-1">
            Category
          </p>
          <p className="text-sm font-semibold text-foreground">
            {product.category?.name || "Uncategorized"}
          </p>
        </div>

        {/* Variants Count */}
        <div className="bg-background/50 rounded-lg p-3 border border-border">
          <p className="text-xs text-muted-foreground font-medium mb-1">
            Total Variants
          </p>
          <p className="text-sm font-semibold text-foreground">
            {product.variants?.length || 0}
          </p>
        </div>

        {/* Stock */}
        <div className="bg-background/50 rounded-lg p-3 border border-border">
          <p className="text-xs text-muted-foreground font-medium mb-1">
            Total Stock
          </p>
          <p className="text-sm font-semibold text-foreground">
            {totalStock} {product.unit || "units"}
          </p>
        </div>

        {/* Status */}
        <div className="bg-background/50 rounded-lg p-3 border border-border">
          <p className="text-xs text-muted-foreground font-medium mb-1">
            Current Status
          </p>
          <div className="flex items-center gap-1">
            {product.isActive === "ACTIVE" ? (
              <CheckCircle2 className="h-3 w-3 text-green-600" />
            ) : (
              <XCircle className="h-3 w-3 text-red-600" />
            )}
            <p className="text-sm font-semibold text-foreground">
              {product.isActive === "ACTIVE" ? "Active" : "Inactive"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Section header for dialogs
 */
function SectionHeader({
  icon: Icon,
  title,
  className = "mb-4 mt-0",
}: {
  readonly icon: React.ElementType;
  readonly title: string;
  readonly className?: string;
}) {
  return (
    <div className={className}>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4" />
        {title}
      </h3>
      <div className="h-px bg-linear-to-r from-border via-border/50 to-transparent mb-3" />
    </div>
  );
}

function DeactivationWarning({
  variantCount,
  totalStock,
}: {
  readonly variantCount: number;
  readonly totalStock: number;
}) {
  return (
    <div className="rounded-lg bg-amber-50 border-2 border-amber-300 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-2">
          <p className="text-sm font-semibold text-amber-900">
            Important: Deactivation Impact
          </p>
          <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
            <li>
              All <strong>{variantCount} variant(s)</strong> will be marked as
              inactive
            </li>
            <li>
              <strong>{totalStock} unit(s)</strong> of stock will remain in the
              system
            </li>
            <li>Product will be hidden from active listings and catalogs</li>
            <li>Historical data and records will be preserved</li>
            <li>You can reactivate this product later if needed</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ProductDateDisplay({ date }: { readonly date: string | Date }) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <span className="text-foreground">
        {new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </div>
  );
}

function VariantsTable({ product }: { readonly product: ProductWithVariants }) {
  const variants = product.variants ?? [];
  const { role } = usePermission();
  const canViewCostPrice = role !== "SELLER";

  if (variants.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic text-center py-4 border rounded-lg">
        No variants found
      </div>
    );
  }

  const fmt = (val: number | string | null | undefined) =>
    val == null
      ? "—"
      : `$${Number(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/40 border-b border-border">
            <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
              Variant
            </th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
              SKU
            </th>
            <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
              Stock
            </th>
            <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
              Selling
            </th>
            {canViewCostPrice && (
              <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                Cost
              </th>
            )}
            <th className="text-center px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {variants.map((v) => {
            const attrs =
              v.attributes
                ?.map((a) =>
                  typeof a.value === "string" ? a.value : a.value?.value,
                )
                .filter((value): value is string => Boolean(value))
                .join(" / ") || "Default";
            const isLow = (v.stock ?? 0) < 10;

            return (
              <tr key={v.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-3 py-2 font-medium text-foreground">
                  {attrs}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                  {v.sku}
                </td>
                <td className="px-3 py-2 text-right">
                  <span
                    className={`font-semibold ${isLow ? "text-red-500" : "text-foreground"}`}
                  >
                    {v.stock ?? 0}
                  </span>
                  {isLow && (
                    <span className="ml-1 text-[10px] text-red-500">low</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right font-semibold text-foreground">
                  {fmt(v.sellingPrice as unknown as number)}
                </td>
                {canViewCostPrice && (
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    {fmt(v.costPrice as unknown as number)}
                  </td>
                )}
                <td className="px-3 py-2 text-center">
                  {v.isActive ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700/50"
                    >
                      Active
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700/50"
                    >
                      Inactive
                    </Badge>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const VIEW_PRODUCT_FIELDS = [
  {
    label: "",
    value: (prod: ProductWithVariants) => <ProductStatsHeader product={prod} />,
  },

  // Basic Information Section
  {
    label: "",
    value: () => <SectionHeader icon={Info} title="Basic Information" />,
  },
  {
    label: "SKU",
    value: (prod: ProductWithVariants) => (
      <ProductField icon={Hash} value={prod.sku} className="font-mono" />
    ),
  },
  {
    label: "Product Name",
    value: (prod: ProductWithVariants) => (
      <ProductField icon={Package} value={prod.name} />
    ),
  },
  {
    label: "Description",
    value: (prod: ProductWithVariants) => (
      <div className="flex items-start gap-2">
        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
        <span className="text-foreground">
          {prod.description || (
            <span className="text-muted-foreground italic">No description</span>
          )}
        </span>
      </div>
    ),
  },
  {
    label: "Category",
    value: (prod: ProductWithVariants) => (
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4 text-muted-foreground" />
        {prod.category ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
            {prod.category.name}
          </span>
        ) : (
          <span className="text-muted-foreground italic">Uncategorized</span>
        )}
      </div>
    ),
  },
  {
    label: "Unit of Measure",
    value: (prod: ProductWithVariants) => (
      <ProductField
        icon={BarChart3}
        value={
          prod.unit || (
            <span className="text-muted-foreground italic">Not specified</span>
          )
        }
        className="text-foreground font-normal"
      />
    ),
  },

  // Inventory Statistics Section
  {
    label: "",
    value: () => (
      <SectionHeader
        icon={TrendingUp}
        title="Inventory Statistics"
        className="mb-4 mt-6"
      />
    ),
  },
  {
    label: "Variants",
    value: (prod: ProductWithVariants) => <VariantsTable product={prod} />,
  },
  {
    label: "Stock Overview",
    value: (prod: ProductWithVariants) => (
      <StockOverviewDisplay product={prod} />
    ),
  },

  // Timestamps Section
  {
    label: "",
    value: () => (
      <SectionHeader
        icon={Calendar}
        title="Record Information"
        className="mb-4 mt-6"
      />
    ),
  },
  {
    label: "Created At",
    value: (prod: ProductWithVariants) => (
      <ProductDateDisplay date={prod.createdAt} />
    ),
  },
  {
    label: "Last Updated",
    value: (prod: ProductWithVariants) => (
      <ProductDateDisplay date={prod.updatedAt} />
    ),
  },
];

// View Product Dialog - Enhanced
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
      title="Product Details"
      description="Details of product information and statistics"
      item={product}
      className="sm:max-w-175"
      fields={VIEW_PRODUCT_FIELDS}
    />
  );
}

// Delete Product Dialog - Enhanced
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
      toast.success("Product deactivated successfully", {
        description: `${product.name} and its variants have been deactivated`,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to deactivate product", {
        description: "Please try again or contact support",
      });
      console.error(error);
    }
  };

  return (
    <ConfirmDialog<ProductWithVariants>
      open={open}
      onOpenChange={onOpenChange}
      title="Deactivate Product"
      description={
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            This action will mark the product and all its variants as inactive.
            The data will be preserved but hidden from active listings.
          </p>
        </div>
      }
      item={product}
      renderItem={(prod) => (
        <div className="space-y-4">
          <ProductSummaryCard product={prod} />

          <DeactivationWarning
            variantCount={prod.variants?.length || 0}
            totalStock={
              prod.variants?.reduce(
                (sum: number, v) => sum + (v.stock || 0),
                0,
              ) || 0
            }
          />

          {/* Info Notice */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800">
                This action does not permanently delete the product. You can
                reactivate it from the inactive products list.
              </p>
            </div>
          </div>
        </div>
      )}
      onConfirm={handleDelete}
      confirmLabel="Deactivate Product"
      isLoading={deleteProduct.isPending}
    />
  );
}

export function ReactivateProductDialog({
  product,
  open,
  onOpenChange,
}: {
  readonly product: ProductWithVariants;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const { reactivateProduct } = useProductMutations();

  const handleReactivate = async () => {
    try {
      await reactivateProduct.mutateAsync(product.id);
      toast.success("Product reactivated successfully", {
        description: `${product.name} and its variants have been reactivated`,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to reactivate product", {
        description: "Please try again or contact support",
      });
      console.error(error);
    }
  };

  return (
    <ConfirmDialog<ProductWithVariants>
      open={open}
      onOpenChange={onOpenChange}
      title="Reactivate Product"
      description={
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            This action will mark the product and all its variants as active.
            The data will be preserved and visible in active listings.
          </p>
        </div>
      }
      item={product}
      renderItem={(prod) => (
        <div className="space-y-4">
          <ProductSummaryCard product={prod} />

          <DeactivationWarning
            variantCount={prod.variants?.length || 0}
            totalStock={
              prod.variants?.reduce(
                (sum: number, v) => sum + (v.stock || 0),
                0,
              ) || 0
            }
          />
        </div>
      )}
      onConfirm={handleReactivate}
      confirmLabel="Reactivate Product"
      isLoading={reactivateProduct.isPending}
    />
  );
}
