import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface OrderSummaryProps {
  discountPercent: number;
  taxPercent: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  onDiscountChange: (value: number) => void;
  onTaxChange: (value: number) => void;
  onSubmit: () => void;
  isValid: boolean;
  isPending: boolean;
}

export const OrderSummary = ({
  discountPercent,
  taxPercent,
  subtotal,
  discount,
  tax,
  total,
  onDiscountChange,
  onTaxChange,
  onSubmit,
  isValid,
  isPending,
}: OrderSummaryProps) => {
  return (
    <div className="bg-card text-card-foreground border rounded-lg shadow p-6 sticky top-6">
      <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

      <div className="space-y-4 mb-6">
        <div>
          <Label className="block text-sm font-medium mb-2">Discount (%)</Label>
          <Input
            type="number"
            value={discountPercent}
            onChange={(e) => onDiscountChange(Number(e.target.value))}
            min="0"
            max="100"
            step="0.01"
          />
        </div>
        <div>
          <Label className="block text-sm font-medium mb-2">Tax (%)</Label>
          <Input
            type="number"
            value={taxPercent}
            onChange={(e) => onTaxChange(Number(e.target.value))}
            min="0"
            max="100"
            step="0.01"
          />
        </div>
      </div>

      <div className="space-y-3 py-4 border-t border-b">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Discount ({discountPercent}%):</span>
          <span className="text-red-600 dark:text-red-400">
            -${discount.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Tax ({taxPercent}%):</span>
          <span>${tax.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex justify-between text-lg font-bold mt-4">
        <span>Total:</span>
        <span className="text-green-600 dark:text-green-400">
          ${total.toFixed(2)}
        </span>
      </div>

      <Button
        onClick={onSubmit}
        className="w-full py-3 rounded-lg font-semibold cursor-pointer transition-colors disabled:cursor-not-allowed"
        disabled={!isValid || isPending}
      >
        {isPending ? (
          <>
            <Spinner className="mr-2 size-4" />
            Completing Sale...
          </>
        ) : (
          "Complete Sale"
        )}
      </Button>

      {!isValid && (
        <p className="text-sm text-muted-foreground text-center mt-2">
          Fill all required fields to complete
        </p>
      )}
    </div>
  );
};
