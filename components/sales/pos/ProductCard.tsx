import Image from "next/image";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PosProduct, PosVariant } from "../../../app/(features)/sales/pos/types";
import {
  getSizeOptions,
  getColorOptions,
  isSizeDisabled,
  isColorDisabled,
  getVariantChipLabel
} from "../../../app/(features)/sales/pos/utils";

interface ProductCardProps {
  product: PosProduct;
  selectedVariantId?: number;
  selectedSizeKey?: string;
  selectedColorKey?: string;
  onSelectSize: (product: PosProduct, sizeKey: string) => void;
  onSelectColor: (product: PosProduct, colorKey: string) => void;
  onSelectVariant: (productId: string, variantId: number) => void;
  onAddToCart: (product: PosProduct) => void;
}

export function ProductCard({
  product,
  selectedVariantId,
  selectedSizeKey,
  selectedColorKey,
  onSelectSize,
  onSelectColor,
  onSelectVariant,
  onAddToCart,
}: ProductCardProps) {
  const hasVariants = product.variants.length > 0;
  const hasSizeDimension = product.variants.some((v) => v.sizeKey);
  const hasColorDimension = product.variants.some((v) => v.colorKey);
  const hasAnySizeOrColor = hasSizeDimension || hasColorDimension;

  const sizeOptions = getSizeOptions(product.variants);
  const colorOptions = getColorOptions(product.variants);
  const selectedVariant = product.variants.find((v) => v.variantId === selectedVariantId);

  return (
    <div className="border rounded-xl p-3 bg-card flex h-full flex-col gap-3">
      <div className="h-40 rounded-lg bg-muted overflow-hidden relative">
        {product.image ? (
          <Image src={product.image} alt={product.name} fill className="object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
      </div>

      <div>
        <p className="font-semibold line-clamp-2">{product.name}</p>
        {hasVariants && selectedVariant ? (
          <p className="text-sm text-primary font-bold">
            ${selectedVariant.price.toFixed(2)}
          </p>
        ) : (
          <p className="text-sm text-amber-600 font-medium">Select an option</p>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">
          {hasAnySizeOrColor ? "Available size/color" : "Available option"}
        </p>
        {hasVariants ? (
          <div className="space-y-2">
            {hasSizeDimension && (
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground">Size</p>
                <div className="flex flex-wrap gap-1">
                  {sizeOptions.map((size) => {
                    const disabled = isSizeDisabled(product.variants, size.key, hasColorDimension ? selectedColorKey : undefined);
                    const isSelected = selectedSizeKey === size.key;
                    return (
                      <button
                        key={size.key}
                        type="button"
                        onClick={() => onSelectSize(product, size.key)}
                        disabled={disabled}
                        className={`text-[10px] px-3 py-1.5 rounded-lg border transition-all duration-200 flex items-center gap-1.5 ${isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-md scale-105 z-10 font-bold"
                            : disabled
                              ? "bg-muted/30 text-muted-foreground/40 border-muted-foreground/5 cursor-not-allowed"
                              : "bg-background/50 text-muted-foreground border-border hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                          }`}
                      >
                        {isSelected && <Check className="size-3" />}
                        {size.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {hasColorDimension && (
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground">Color</p>
                <div className="flex flex-wrap gap-1">
                  {colorOptions.map((color) => {
                    const disabled = isColorDisabled(product.variants, color.key, hasSizeDimension ? selectedSizeKey : undefined);
                    const isSelected = selectedColorKey === color.key;
                    return (
                      <button
                        key={color.key}
                        type="button"
                        onClick={() => onSelectColor(product, color.key)}
                        disabled={disabled}
                        className={`text-[10px] px-3 py-1.5 rounded-lg border transition-all duration-200 inline-flex items-center gap-2 ${isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-md scale-105 z-10 font-bold"
                            : disabled
                              ? "bg-muted/30 text-muted-foreground/40 border-muted-foreground/5 cursor-not-allowed"
                              : "bg-background/50 text-muted-foreground border-border hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                          }`}
                      >
                        <div className="relative">
                          <span
                            className="block size-3 rounded-full border border-black/10"
                            style={color.colorHex ? { backgroundColor: color.colorHex } : undefined}
                          />
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Check className="size-2 text-primary-foreground drop-shadow-sm" />
                            </div>
                          )}
                        </div>
                        <span>{color.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {!hasAnySizeOrColor && (
              <div className="flex flex-wrap gap-1">
                {product.variants.map((variant) => (
                  <button
                    key={variant.variantId}
                    type="button"
                    onClick={() => onSelectVariant(product.id, variant.variantId)}
                    className={`text-[10px] px-2 py-1 rounded-full border ${selectedVariantId === variant.variantId
                        ? "bg-primary text-primary-foreground"
                        : "bg-background hover:bg-accent"
                      }`}
                  >
                    {getVariantChipLabel(variant)}
                  </button>
                ))}
              </div>
            )}
            <p className="text-[10px] text-muted-foreground pt-1">
              Selected: {selectedVariant ? (
                <span className="text-primary font-bold">{getVariantChipLabel(selectedVariant)}</span>
              ) : "None"}
            </p>
          </div>
        ) : (
          <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1 w-max">
            No variants available
          </div>
        )}
      </div>

      <Button
        className="w-full mt-auto"
        onClick={() => onAddToCart(product)}
        disabled={!selectedVariant}
        variant={selectedVariant ? "default" : "outline"}
      >
        <Plus className="size-4 mr-1" /> Add to Cart
      </Button>
    </div>
  );
}
