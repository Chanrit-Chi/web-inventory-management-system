"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Image from "next/image";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Search, Package, CheckCircle2 } from "lucide-react";
import { useGetProducts } from "@/hooks/useProduct";
import { useAdjustStock } from "@/hooks/useStock";
import { StockMovementType } from "@prisma/client";
import { Spinner } from "@/components/ui/spinner";

const adjustmentSchema = z.object({
  variantId: z.number().min(1, "Please select a product variant"),
  movementType: z.enum(["ADJUSTMENT", "DAMAGE", "RETURN"] as const),
  action: z.enum(["add", "subtract"] as const),
  quantity: z.number().positive().int("Quantity must be a whole number"),
  reason: z.string().min(3, "Reason must be at least 3 characters").max(200),
});

type AdjustmentValues = z.infer<typeof adjustmentSchema>;

interface ProductSearchResult {
  id: number;
  name: string;
  image?: string | null;
  variants: Array<{
    id: number;
    sku: string;
    stock: number;
    attributes: Array<{
      value: {
        value: string;
      };
    }>;
  }>;
}

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StockAdjustmentDialog({
  open,
  onOpenChange,
}: Readonly<StockAdjustmentDialogProps>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] =
    useState<ProductSearchResult | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<
    ProductSearchResult["variants"][0] | null
  >(null);
  const [pendingProduct, setPendingProduct] =
    useState<ProductSearchResult | null>(null);
  const [pendingVariant, setPendingVariant] = useState<
    ProductSearchResult["variants"][0] | null
  >(null);

  const { data: searchResponse, isLoading: isSearching } = useGetProducts(
    1,
    10,
    searchQuery || undefined,
    { isActive: "true" },
  );

  const adjustStockMutation = useAdjustStock();

  const form = useForm<AdjustmentValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      movementType: "ADJUSTMENT",
      action: "add",
      quantity: 1,
      reason: "",
    },
  });

  const onSubmit = async (values: AdjustmentValues) => {
    const finalQuantity =
      values.action === "add" ? values.quantity : -values.quantity;

    await adjustStockMutation.mutateAsync({
      variantId: values.variantId,
      movementType: values.movementType as StockMovementType,
      quantity: finalQuantity,
      reason: values.reason,
    });

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    form.reset();
    setSelectedProduct(null);
    setSelectedVariant(null);
    setSearchQuery("");
    setPendingProduct(null);
    setPendingVariant(null);
  };

  const handleSelectVariant = (
    product: ProductSearchResult,
    variant: ProductSearchResult["variants"][0],
  ) => {
    setSelectedProduct(product);
    setSelectedVariant(variant);
    form.setValue("variantId", variant.id);
  };

  const renderSearchResults = () => {
    if (isSearching) {
      return (
        <div className="p-8 text-center">
          <Spinner className="mx-auto" />
        </div>
      );
    }

    if (searchResponse?.data?.length) {
      return (searchResponse.data as ProductSearchResult[]).map((product) => (
        <div key={product.id} className="p-2 space-y-1">
          <div className="flex items-center gap-2 px-2 py-1">
            {product.image ? (
              <div className="size-6 relative rounded overflow-hidden border">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="size-6 rounded bg-muted flex items-center justify-center border">
                <Package className="size-3 text-muted-foreground" />
              </div>
            )}
            <div className="font-semibold text-xs text-primary">
              {product.name}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-1">
            {product.variants.map((variant) => {
              const isPending =
                pendingProduct?.id === product.id &&
                pendingVariant?.id === variant.id;
              return (
                <button
                  key={variant.id}
                  onClick={() => {
                    setPendingProduct(product);
                    setPendingVariant(variant);
                  }}
                  className={cn(
                    "flex items-center justify-between p-2 hover:bg-accent rounded-md text-sm text-left group",
                    isPending && "bg-primary/10 border border-primary/30",
                  )}
                >
                  <div className="flex flex-col">
                    <span className="font-mono text-xs text-muted-foreground">
                      SKU: {variant.sku}
                    </span>
                    <span>
                      {variant.attributes
                        ?.map((a) => a.value?.value)
                        .join(" / ") || "Default Variant"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-muted px-1.5 rounded">
                      Stock: {variant.stock}
                    </span>
                    {isPending ? (
                      <CheckCircle2 className="size-4 text-primary" />
                    ) : (
                      <CheckCircle2 className="size-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ));
    }

    if (searchQuery) {
      return (
        <div className="p-8 text-center text-muted-foreground text-sm">
          No products found
        </div>
      );
    }

    return (
      <div className="p-8 text-center text-muted-foreground text-sm">
        Start typing to find a product
      </div>
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val);
        if (!val) resetForm();
      }}
    >
      <DialogContent
        className="sm:max-w-125"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Adjust Stock Level</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {selectedVariant ? (
            <div className="bg-accent/50 p-3 rounded-md flex items-start gap-3 border">
              {selectedProduct?.image ? (
                <div className="size-12 relative rounded overflow-hidden border shrink-0">
                  <Image
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="bg-primary/10 size-12 rounded flex items-center justify-center border shrink-0">
                  <Package className="size-6 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">
                  {selectedProduct?.name}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="font-mono">{selectedVariant?.sku}</span>
                  {(selectedVariant?.attributes?.length ?? 0) > 0 && (
                    <>
                      <span>•</span>
                      <span>
                        {selectedVariant?.attributes
                          .map((a) => a.value?.value)
                          .join(" / ")}
                      </span>
                    </>
                  )}
                </div>
                <div className="mt-1 text-xs font-bold text-primary">
                  Current Stock: {selectedVariant?.stock}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  setSelectedVariant(null);
                  setSelectedProduct(null);
                  form.setValue("variantId", 0);
                }}
              >
                Change
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search product by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="max-h-75 overflow-y-auto border rounded-md divide-y">
                {renderSearchResults()}
              </div>

              {pendingVariant && (
                <div className="flex items-center justify-between rounded-md border border-primary/30 bg-primary/5 px-3 py-2">
                  <div className="text-xs">
                    <span className="font-semibold">
                      {pendingProduct?.name}
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      — {pendingVariant.sku}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      if (pendingProduct && pendingVariant) {
                        handleSelectVariant(pendingProduct, pendingVariant);
                        setPendingProduct(null);
                        setPendingVariant(null);
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>
          )}

          {selectedVariant && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="movementType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adjust Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ADJUSTMENT">
                              Adjustment
                            </SelectItem>
                            <SelectItem value="DAMAGE">Damage</SelectItem>
                            <SelectItem value="RETURN">Return</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="action"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Action</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Action" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="add">Add (+)</SelectItem>
                            <SelectItem value="subtract">
                              Subtract (-)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Why are you adjusting this stock? (e.g. Expired, Count Discrepancy)"
                          {...field}
                          className="resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={adjustStockMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={adjustStockMutation.isPending}
                  >
                    {adjustStockMutation.isPending
                      ? "Processing..."
                      : "Submit Adjustment"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
