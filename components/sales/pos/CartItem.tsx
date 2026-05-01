import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem as CartItemType } from "../../../app/(features)/sales/pos/types";

interface CartItemProps {
  item: CartItemType;
  onChangeQty: (productId: string, variantId: number, delta: number) => void;
}

export function CartItem({ item, onChangeQty }: CartItemProps) {
  return (
    <div className="border rounded-lg p-2">
      <div className="flex justify-between">
        <div className="flex items-start gap-2">
          <div className="relative size-12 rounded-md overflow-hidden bg-muted shrink-0">
            {item.image ? (
              <Image src={item.image} alt={item.name} fill className="object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground">
                No image
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium line-clamp-1">{item.name}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {item.variantLabel}
            </p>
            <p className="text-sm font-semibold">${item.price.toFixed(2)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => onChangeQty(item.productId, item.variantId, -1)}
          >
            <Minus className="size-3" />
          </Button>
          <span className="text-sm w-5 text-center">{item.quantity}</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => onChangeQty(item.productId, item.variantId, 1)}
          >
            <Plus className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
