import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useGetProducts } from "@/hooks/useProduct";
import { lookupVariantByCode } from "@/lib/barcode-scan";
import { BarcodeScannerInput } from "@/components/barcode-scanner-input";
import { Product } from "@/schemas/type-export.schema";

export interface ProductForSale {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
  price: number;
  stock: number;
  variantId: number;
  _count: {
    orderDetail: number;
  };
  searchText: string;
  image?: string;
}

export interface ProductSearchProps {
  onAddProduct: (product: ProductForSale) => void;
}

interface DecimalLike {
  toNumber: () => number;
}

const getPriceValue = (val: DecimalLike | string | number): number => {
  if (val == null) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "string") return Number.parseFloat(val);
  if (typeof val === "object" && "toNumber" in val) {
    return val.toNumber();
  }
  return 0;
};

const getAttributeDisplay = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const obj = value as {
      attribute?: { name?: string };
      value?: string;
      displayValue?: string;
    };
    const val = obj.displayValue || obj.value;
    return String(val || "");
  }
  return "";
};

// Process products into ProductForSale format
const processProductsForSale = (products: Product[]): ProductForSale[] => {
  return products.flatMap((p: Product) =>
    p.variants
      .filter((variant) => variant.isActive)
      .map((variant) => {
        // Calculate price (prefer sellingPrice, fallback to costPrice)
        let price = 0;

        price = getPriceValue(variant.sellingPrice);

        // Fallback to cost price if selling price is 0 or invalid
        if (price === 0) {
          price = getPriceValue(variant.costPrice);
        }

        // Create variant description from attributes
        const variantDescription =
          variant.attributes
            ?.map((attr) => getAttributeDisplay(attr.value))
            .filter(Boolean)
            .join(" / ") || "";

        // Create display name: "Product Name - Color: Red Size: M"
        const displayName = variantDescription
          ? `${p.name} - ${variantDescription}`
          : `${p.name} (${variant.sku})`;

        // Create search text: "Product Name SKU Color Red Size M"
        const searchText =
          `${p.name} ${variant.sku} ${(variant as { barcode?: string | null }).barcode ?? ""} ${variantDescription.replaceAll(":", "")}`.toLowerCase();

        return {
          id: p.id,
          name: displayName,
          sku: variant.sku,
          barcode: (variant as { barcode?: string | null }).barcode ?? null,
          price,
          stock: variant.stock || 0,
          variantId: variant.id!,
          _count: (variant._count || { orderDetail: 0 }) as {
            orderDetail: number;
          },
          searchText,
          image: p.image || undefined,
        };
      }),
  );
};

export const ProductSearch = ({ onAddProduct }: ProductSearchProps) => {
  const [searchProduct, setSearchProduct] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchProduct);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchProduct]);

  // Search products when debounced search changes
  const { data: searchResponse, isLoading: isSearching } = useGetProducts(
    1,
    50, // Limit search results to 50 for performance
    debouncedSearch || undefined,
    { isActive: "true" }, // Only show active products
  );

  // Process search results
  const searchResults = useMemo(() => {
    if (!searchResponse?.data) return [];
    return processProductsForSale(searchResponse.data as Product[]);
  }, [searchResponse]);

  // Get top-selling products for suggestions when no search
  const { data: topProductsResponse } = useGetProducts(
    1,
    100, // Get more products to find top sellers
    undefined,
    { isActive: "true" },
  );

  const topSellingProducts = useMemo(() => {
    if (!topProductsResponse?.data) return [];
    const processed = processProductsForSale(
      topProductsResponse.data as Product[],
    );
    return processed
      .toSorted((a, b) => b._count.orderDetail - a._count.orderDetail)
      .slice(0, 10);
  }, [topProductsResponse]);

  // Determine which products to display
  const displayedProducts = debouncedSearch
    ? searchResults
    : topSellingProducts;

  const handleAddProduct = (product: ProductForSale) => {
    onAddProduct(product);
    setShowProductSearch(false);
    setSearchProduct("");
    setDebouncedSearch("");
  };

  const variantToProductForSale = (variant: {
    id?: number;
    sku?: string;
    barcode?: string | null;
    stock?: number;
    sellingPrice?: DecimalLike | string;
    costPrice?: DecimalLike | string;
    _count?: { orderDetail?: number };
    product?: { id?: string; name?: string; image?: string | null };
    attributes?: Array<{
      value?: {
        attribute?: { name?: string | null };
        value?: string | null;
        displayValue?: string | null;
      };
    }>;
  }): ProductForSale | null => {
    if (!variant.id || !variant.product?.id || !variant.product?.name) {
      return null;
    }

    let price = getPriceValue(variant.sellingPrice ?? 0);
    if (price === 0) {
      price = getPriceValue(variant.costPrice ?? 0);
    }

    const variantDescription =
      variant.attributes
        ?.map((attr) => {
          const displayValue = attr.value?.displayValue?.trim();
          const attributeValue = displayValue || attr.value?.value;
          return attributeValue || "";
        })
        .filter(Boolean)
        .join(" / ") || "";

    const displayName = variantDescription
      ? `${variant.product.name} - ${variantDescription}`
      : `${variant.product.name} (${variant.sku ?? ""})`;

    return {
      id: variant.product.id,
      name: displayName,
      sku: variant.sku ?? "",
      barcode: variant.barcode ?? null,
      price,
      stock: variant.stock ?? 0,
      variantId: variant.id,
      _count: {
        orderDetail: variant._count?.orderDetail ?? 0,
      },
      searchText:
        `${variant.product.name} ${variant.sku ?? ""} ${variant.barcode ?? ""}`.toLowerCase(),
      image: variant.product.image || undefined,
    };
  };

  const handleBarcodeScan = async (code: string) => {
    const variant = await lookupVariantByCode<{ isActive?: boolean; product?: { isActive?: boolean } }>(code);

    if (!variant) {
      toast.error("No product variant found for scanned code");
      return;
    }

    if (variant.isActive === false) {
      toast.error("This product variant is inactive and cannot be sold");
      return;
    }

    if (variant.product && variant.product.isActive === false) {
      toast.error("This product is inactive and cannot be sold");
      return;
    }

    const product = variantToProductForSale(
      variant as Parameters<typeof variantToProductForSale>[0],
    );

    if (!product) {
      toast.error("Unable to map scanned item to sale product");
      return;
    }

    if (product.stock <= 0) {
      toast.error(`${product.name} is out of stock!`);
      return;
    }

    handleAddProduct(product);
    toast.success("Scanned product added");
  };

  const renderSearchResults = () => {
    if (isSearching) {
      return (
        <div className="px-4 py-3 text-muted-foreground text-center">
          Searching...
        </div>
      );
    }

    if (displayedProducts.length > 0) {
      return displayedProducts.map((product) => {
        let stockColorClass = "";
        if (product.stock <= 0) {
          stockColorClass = "text-red-500 font-bold";
        } else if (product.stock <= 5) {
          stockColorClass = "text-amber-500 font-bold";
        }

        return (
          <button
            key={`${product.id}-${product.variantId}`}
            onClick={() => {
              if (product.stock <= 0) {
                toast.error(`${product.name} is out of stock!`);
                return;
              }
              handleAddProduct(product);
            }}
            className={`w-full px-4 py-3 text-left hover:bg-accent hover:text-accent-foreground border-b last:border-b-0 transition-colors ${product.stock <= 0
              ? "opacity-60 cursor-not-allowed bg-red-50/10"
              : ""
              }`}
          >
            <div className="flex gap-3 items-start">
              {product.image && (
                <div className="relative w-12 h-12 shrink-0 overflow-hidden rounded-md border mt-0.5">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <div className="font-medium truncate mr-2">
                    {product.name}
                  </div>
                  <div className="flex gap-1">
                    {product.stock <= 0 && (
                      <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider whitespace-nowrap">
                        Out of Stock
                      </span>
                    )}
                    {product.stock > 0 && product.stock <= 5 && (
                      <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider whitespace-nowrap">
                        Low Stock
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-mono">SKU: {product.sku}</span>
                  <span>•</span>
                  <span className="font-semibold text-primary">
                    ${product.price.toFixed(2)}
                  </span>
                  <span>•</span>
                  <span className={stockColorClass}>
                    Stock: {product.stock}
                  </span>
                  <span>•</span>
                  <span className="whitespace-nowrap">
                    Sold: {product._count.orderDetail}
                  </span>
                </div>
              </div>
            </div>
          </button>
        );
      });
    }

    if (debouncedSearch) {
      return (
        <div className="px-4 py-3 text-muted-foreground text-center">
          No products found
        </div>
      );
    }

    return null;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-lg font-semibold shrink-0">Products</h2>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <BarcodeScannerInput onScan={handleBarcodeScan} />
          <Button
            onClick={() => setShowProductSearch(!showProductSearch)}
            className="flex-1 sm:flex-none items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            Add Product
          </Button>
        </div>
      </div>

      {showProductSearch && (
        <div className="mb-4 relative">
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-background">
            <Search size={20} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              className="flex-1 outline-none bg-transparent"
            />
          </div>
          <div className="absolute z-10 w-full mt-1 bg-popover text-popover-foreground border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {renderSearchResults()}
          </div>
        </div>
      )}
    </div>
  );
};
