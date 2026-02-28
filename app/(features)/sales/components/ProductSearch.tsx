import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useGetProducts } from "@/hooks/useProduct";
import { Product } from "@/schemas/type-export.schema";

export interface ProductForSale {
  id: string;
  name: string;
  sku: string;
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

// Process products into ProductForSale format
const processProductsForSale = (products: Product[]): ProductForSale[] => {
  return products.flatMap((p: Product) =>
    p.variants
      .filter((variant) => variant.isActive)
      .map((variant) => {
        // Calculate price (prefer sellingPrice, fallback to costPrice)
        let price = 0;

        const getPriceValue = (val: DecimalLike | string): number => {
          if (val == null) return 0;
          if (typeof val === "number") return val;
          if (typeof val === "string") return Number.parseFloat(val);
          if (typeof val === "object" && "toNumber" in val) {
            return val.toNumber();
          }
          return 0;
        };

        price = getPriceValue(variant.sellingPrice);

        // Fallback to cost price if selling price is 0 or invalid
        if (price === 0) {
          price = getPriceValue(variant.costPrice);
        }

        // Create variant description from attributes
        const variantDescription =
          variant.attributes
            ?.map((attr) =>
              attr.value
                ? `${attr.value.attribute?.name}: ${attr.value.value}`
                : "",
            )
            .filter(Boolean)
            .join(" ") || "";

        // Create display name: "Product Name - Color: Red Size: M"
        const displayName = variantDescription
          ? `${p.name} - ${variantDescription}`
          : `${p.name} (${variant.sku})`;

        // Create search text: "Product Name SKU Color Red Size M"
        const searchText =
          `${p.name} ${variant.sku} ${variantDescription.replaceAll(":", "")}`.toLowerCase();

        return {
          id: p.id,
          name: displayName,
          sku: variant.sku,
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
            className={`w-full px-4 py-3 text-left hover:bg-accent border-b last:border-b-0 transition-colors ${
              product.stock <= 0
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
                      <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider whitespace-nowrap">
                        Out of Stock
                      </span>
                    )}
                    {product.stock > 0 && product.stock <= 5 && (
                      <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider whitespace-nowrap">
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Products</h2>
        <Button
          onClick={() => setShowProductSearch(!showProductSearch)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          Add Product
        </Button>
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
          <div className="absolute z-10 w-full mt-1 bg-card border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {renderSearchResults()}
          </div>
        </div>
      )}
    </div>
  );
};
