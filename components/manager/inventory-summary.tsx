"use client";

import React from "react";
import { Package, AlertTriangle, TrendingDown, Archive } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useGetProducts } from "@/hooks/useProduct";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";

type VariantItem = {
  id: number;
  sku: string;
  stock: number;
  isActive: boolean;
  attributes?: Array<{
    value?: { value: string; attribute?: { name: string } };
  }>;
};

type ProductItem = {
  id: string;
  name: string;
  image: string | null;
  sku: string;
  isActive: boolean;
  variants: VariantItem[];
  category?: { name: string } | null;
};

function lowestStock(product: ProductItem) {
  if (!product.variants.length) return Infinity;
  return Math.min(...product.variants.map((v) => v.stock));
}

function totalStock(product: ProductItem) {
  return product.variants.reduce((sum, v) => sum + v.stock, 0);
}

function getStockClassName(stock: number): string {
  if (stock === 0) return "text-red-600 font-semibold";
  if (stock < 10) return "text-amber-600 font-semibold";
  return "text-green-600 font-semibold";
}

export default function InventorySummary() {
  const { data: productsData, isLoading: productsLoading } = useGetProducts(
    1,
    50,
  );

  const products = (productsData?.data ?? []) as ProductItem[];

  // Calculate metrics
  const activeProducts = products.filter((p) => p.isActive).length;
  const lowStockProducts = products.filter((p) =>
    p.variants.some((v) => v.isActive && v.stock < 10),
  );
  const outOfStockProducts = products.filter((p) =>
    p.variants.every((v) => !v.isActive || v.stock === 0),
  );
  const totalStockValue = products.reduce((sum, p) => sum + totalStock(p), 0);

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Inventory Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-lg">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Products</p>
              <p className="text-2xl font-bold">{activeProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 dark:bg-amber-900/30 p-2.5 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Low Stock</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {lowStockProducts.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 dark:bg-red-900/30 p-2.5 rounded-lg">
              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {outOfStockProducts.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 dark:bg-green-900/30 p-2.5 rounded-lg">
              <Archive className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Units</p>
              <p className="text-2xl font-bold">{totalStockValue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert Table */}
      {lowStockProducts.length > 0 && (
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="p-4 border-b bg-muted/50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold">Low Stock Alert</h3>
              <Badge variant="secondary" className="ml-auto">
                {lowStockProducts.length} items
              </Badge>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30 text-xs">
                <tr>
                  <th className="text-left p-3 font-medium">Product</th>
                  <th className="text-left p-3 font-medium">SKU</th>
                  <th className="text-left p-3 font-medium">Category</th>
                  <th className="text-right p-3 font-medium">Stock</th>
                  <th className="text-right p-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {lowStockProducts.slice(0, 5).map((product) => {
                  const stock = lowestStock(product);
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {product.image ? (
                            <div className="size-10 relative rounded overflow-hidden border">
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="size-10 rounded bg-muted flex items-center justify-center border">
                              <Package className="size-4 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{product.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {product.sku}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">
                          {product.category?.name || "Uncategorized"}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <span className={getStockClassName(stock)}>
                          {stock}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <Link
                          href={`/stock/adjust`}
                          className="text-xs text-primary hover:underline"
                        >
                          Restock
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {lowStockProducts.length > 5 && (
            <div className="p-3 border-t bg-muted/20 text-center">
              <Link
                href="/products"
                className="text-sm text-primary hover:underline"
              >
                View all {lowStockProducts.length} low stock items →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
