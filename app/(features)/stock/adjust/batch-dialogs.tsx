"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { cn } from "@/lib/utils";
import {
  Search,
  Package,
  Trash2,
  PlusCircle,
  CheckCircle2,
} from "lucide-react";
import { useGetProducts } from "@/hooks/useProduct";
import { useBulkAdjustStock } from "@/hooks/useStock";
import { Spinner } from "@/components/ui/spinner";
import {
  batchAdjustmentSchema,
  BatchAdjustmentValues,
} from "@/schemas/type-export.schema";

interface ProductSearchResult {
  id: string;
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

interface ProductSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (
    product: ProductSearchResult,
    variant: ProductSearchResult["variants"][0],
  ) => void;
  selectedVariantIds: number[];
}

function ProductSelectionDialog({
  open,
  onOpenChange,
  onSelect,
  selectedVariantIds,
}: Readonly<ProductSelectionDialogProps>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingVariants, setPendingVariants] = useState<
    Array<{
      product: ProductSearchResult;
      variant: ProductSearchResult["variants"][0];
    }>
  >([]);

  const { data: searchResponse, isLoading: isSearching } = useGetProducts(
    1,
    10,
    searchQuery || undefined,
    { isActive: "true" },
  );

  const handleOpenChange = (val: boolean) => {
    if (!val) setPendingVariants([]);
    onOpenChange(val);
  };

  const isVariantPending = (variantId: number) =>
    pendingVariants.some((p) => p.variant.id === variantId);

  const toggleVariant = (
    product: ProductSearchResult,
    variant: ProductSearchResult["variants"][0],
  ) => {
    if (selectedVariantIds.includes(variant.id)) return;
    if (isVariantPending(variant.id)) {
      setPendingVariants((prev) =>
        prev.filter((p) => p.variant.id !== variant.id),
      );
    } else {
      setPendingVariants((prev) => [...prev, { product, variant }]);
    }
  };

  const toggleAllVariants = (product: ProductSearchResult) => {
    const available = product.variants.filter(
      (v) => !selectedVariantIds.includes(v.id),
    );
    const allPending = available.every((v) => isVariantPending(v.id));
    if (allPending) {
      setPendingVariants((prev) =>
        prev.filter((p) => !available.some((v) => v.id === p.variant.id)),
      );
    } else {
      const toAdd = available
        .filter((v) => !isVariantPending(v.id))
        .map((v) => ({ product, variant: v }));
      setPendingVariants((prev) => [...prev, ...toAdd]);
    }
  };

  const handleConfirm = () => {
    pendingVariants.forEach(({ product, variant }) =>
      onSelect(product, variant),
    );
    setPendingVariants([]);
    onOpenChange(false);
  };

  const renderProductList = () => {
    if (isSearching) {
      return (
        <div className="p-8 text-center">
          <Spinner className="mx-auto" />
        </div>
      );
    }

    if (searchResponse?.data?.length) {
      return (searchResponse.data as ProductSearchResult[]).map((product) => {
        const totalVariants = product.variants.length;
        const addedCount = product.variants.filter((v) =>
          selectedVariantIds.includes(v.id),
        ).length;
        const available = product.variants.filter(
          (v) => !selectedVariantIds.includes(v.id),
        );
        const pendingCount = available.filter((v) =>
          isVariantPending(v.id),
        ).length;
        const allAvailablePending =
          available.length > 0 &&
          available.every((v) => isVariantPending(v.id));
        const someSelected =
          (addedCount > 0 || pendingCount > 0) &&
          addedCount + pendingCount < totalVariants;

        return (
          <div key={product.id} className="p-2 space-y-1">
            <div className="flex items-center gap-2 px-2 py-1">
              {/* Product-level checkbox */}
              <input
                type="checkbox"
                ref={(el) => {
                  if (el)
                    el.indeterminate = someSelected && !allAvailablePending;
                }}
                checked={allAvailablePending || addedCount === totalVariants}
                onChange={() => toggleAllVariants(product)}
                disabled={addedCount === totalVariants}
                title={
                  addedCount === totalVariants
                    ? "All variants already added"
                    : "Select all variants"
                }
                className="size-3.5 cursor-pointer accent-primary disabled:cursor-default"
              />
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
              <div className="font-semibold text-xs text-primary flex-1">
                {product.name}
              </div>
              {(addedCount > 0 || pendingCount > 0) && (
                <span className="text-[10px] text-muted-foreground">
                  {addedCount + pendingCount}/{totalVariants}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-1">
              {product.variants.map((variant) => {
                const isAdded = selectedVariantIds.includes(variant.id);
                const isPending = isVariantPending(variant.id);
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => toggleVariant(product, variant)}
                    disabled={isAdded}
                    className={cn(
                      "flex items-center justify-between p-2 hover:bg-accent rounded-md text-sm text-left group disabled:opacity-50",
                      isPending && "bg-primary/10 border border-primary/30",
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        SKU: {variant.sku}
                      </span>
                      <span>
                        {variant.attributes
                          ?.map((a) => a.value?.value)
                          .join(" / ") || "Default"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-muted px-1.5 rounded">
                        Stock: {variant.stock}
                      </span>
                      {isAdded && (
                        <CheckCircle2 className="size-4 text-green-500" />
                      )}
                      {!isAdded && isPending && (
                        <CheckCircle2 className="size-4 text-primary" />
                      )}
                      {!isAdded && !isPending && (
                        <PlusCircle className="size-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      });
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
        Type to search products...
      </div>
    );
  };

  const pendingCount = pendingVariants.length;
  const itemWord = pendingCount === 1 ? "Item" : "Items";
  const addButtonLabel =
    pendingCount === 0 ? "Add Items" : `Add ${pendingCount} ${itemWord}`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[80vh] flex flex-col p-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Select Products</DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search product name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          <div className="flex-1 overflow-y-auto rounded-md border divide-y">
            {renderProductList()}
          </div>
        </div>
        <DialogFooter className="p-6 pt-0 gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={pendingCount === 0}>
            {addButtonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface BatchStockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BatchStockAdjustmentDialog({
  open,
  onOpenChange,
}: Readonly<BatchStockAdjustmentDialogProps>) {
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);

  const bulkAdjustMutation = useBulkAdjustStock();

  const form = useForm<BatchAdjustmentValues>({
    resolver: zodResolver(batchAdjustmentSchema),
    defaultValues: {
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onSubmit = async (values: BatchAdjustmentValues) => {
    const adjustments = values.items.map((item) => ({
      variantId: item.variantId,
      movementType: item.movementType,
      quantity: item.action === "add" ? item.quantity : -item.quantity,
      reason: item.reason,
    }));

    await bulkAdjustMutation.mutateAsync({ adjustments });
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    form.reset({ items: [] });
    setIsSelectionOpen(false);
  };

  const addItem = (
    product: ProductSearchResult,
    variant: ProductSearchResult["variants"][0],
  ) => {
    // Check if variant is already added
    if (fields.some((f) => f.variantId === variant.id)) {
      return;
    }

    append({
      variantId: variant.id,
      movementType: "ADJUSTMENT",
      action: "add",
      quantity: 1,
      reason: "Batch Adjustment",
      productName: product.name,
      sku: variant.sku,
      attributes:
        variant.attributes?.map((a) => a.value?.value).join(" / ") || "Default",
      image: product.image,
    });
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
        className="sm:max-w-5xl max-h-[95vh] flex flex-col p-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="size-5 text-primary" />
            Batch Stock Adjustment
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Item Selector */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Items to Adjust ({fields.length})
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsSelectionOpen(true)}
                className="gap-2"
              >
                Add Products
                <PlusCircle className="size-4" />
              </Button>
            </div>

            <ProductSelectionDialog
              open={isSelectionOpen}
              onOpenChange={setIsSelectionOpen}
              onSelect={addItem}
              selectedVariantIds={fields.map((f) => f.variantId)}
            />

            {fields.length === 0 && (
              <div className="border-2 border-dashed rounded-lg p-12 text-center space-y-3">
                <div className="bg-primary/10 size-12 rounded-full flex items-center justify-center mx-auto">
                  <Package className="size-6 text-primary" />
                </div>
                <div className="text-sm text-muted-foreground">
                  No items added to the batch yet.
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setIsSelectionOpen(true)}
                >
                  Start by adding a product
                </Button>
              </div>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="group relative rounded-lg border bg-card p-4 shadow-sm transition-all hover:border-primary/30"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        {/* Variant Info */}
                        <div className="md:col-span-4 flex gap-3">
                          {field.image ? (
                            <div className="size-10 relative rounded overflow-hidden border shrink-0">
                              <Image
                                src={field.image}
                                alt={field.productName}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="bg-primary/5 size-10 rounded flex items-center justify-center border shrink-0">
                              <Package className="size-5 text-primary" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {field.productName}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">
                              SKU: {field.sku}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {field.attributes}
                            </p>
                          </div>
                        </div>

                        {/* Adjust Controls */}
                        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-12 gap-2 items-end">
                          <FormField
                            control={form.control}
                            name={`items.${index}.movementType`}
                            render={({ field: f }) => (
                              <FormItem className="space-y-1 sm:col-span-3">
                                <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">
                                  Type
                                </FormLabel>
                                <Select
                                  onValueChange={f.onChange}
                                  defaultValue={f.value}
                                >
                                  <FormControl>
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="ADJUSTMENT">
                                      Adj
                                    </SelectItem>
                                    <SelectItem value="DAMAGE">Dmg</SelectItem>
                                    <SelectItem value="RETURN">Ret</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`items.${index}.action`}
                            render={({ field: f }) => (
                              <FormItem className="space-y-1 sm:col-span-2">
                                <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">
                                  Action
                                </FormLabel>
                                <Select
                                  onValueChange={f.onChange}
                                  defaultValue={f.value}
                                >
                                  <FormControl>
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="add">+</SelectItem>
                                    <SelectItem value="subtract">-</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field: f }) => (
                              <FormItem className="space-y-1 sm:col-span-2">
                                <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">
                                  Qty
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    className="h-8 text-xs"
                                    {...f}
                                    onChange={(e) =>
                                      f.onChange(Number(e.target.value))
                                    }
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <div className="flex items-center gap-2 sm:col-span-5">
                            <FormField
                              control={form.control}
                              name={`items.${index}.reason`}
                              render={({ field: f }) => (
                                <FormItem className="space-y-1 flex-1">
                                  <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">
                                    Reason
                                  </FormLabel>
                                  <FormControl>
                                    <Input className="h-8 text-xs" {...f} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {fields.length > 0 && (
                  <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={bulkAdjustMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={bulkAdjustMutation.isPending}
                    >
                      {bulkAdjustMutation.isPending
                        ? "Processing..."
                        : "Submit All Adjustments"}
                    </Button>
                  </DialogFooter>
                )}
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
