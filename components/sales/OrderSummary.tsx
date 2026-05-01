import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { StepperInput } from "@/components/ui/stepper-input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface OrderSummaryProps {
  discountPercent: number;
  taxPercent: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid?: number;
  onDiscountChange: (value: number) => void;
  onTaxChange: (value: number) => void;
  onAmountPaidChange?: (value: number) => void;
  onSubmit: () => void;
  isValid: boolean;
  isPending: boolean;
  ctaLabel?: string;
  loadingLabel?: string;
}

export const OrderSummary = ({
  discountPercent,
  taxPercent,
  subtotal,
  discount,
  tax,
  total,
  amountPaid,
  onDiscountChange,
  onTaxChange,
  onAmountPaidChange,
  onSubmit,
  isValid,
  isPending,
  ctaLabel = "Complete Sale",
  loadingLabel = "Processing...",
}: OrderSummaryProps) => {
  return (
    <div className="bg-card text-card-foreground border rounded-lg shadow p-6 sticky top-6">
      <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

      <div className="space-y-4 mb-6">
        <div>
          <Label className="block text-sm font-medium mb-2">Discount (%)</Label>
          <StepperInput
            value={discountPercent}
            onChange={(e) => onDiscountChange(Number(e.target.value))}
            min={0}
            max={100}
            step={0.01}
          />
        </div>
        <div>
          <Label className="block text-sm font-medium mb-2">Tax (%)</Label>
          <StepperInput
            value={taxPercent}
            onChange={(e) => onTaxChange(Number(e.target.value))}
            min={0}
            max={100}
            step={0.01}
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

      {amountPaid !== undefined && onAmountPaidChange !== undefined && (
        <div className="mt-4 pt-4 border-t space-y-3 mb-6">
          <div>
            <Label className="block text-sm font-medium mb-2">Amount Paid / Tendered</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={amountPaid === 0 && total === 0 ? "" : amountPaid}
                  onChange={(e) => onAmountPaidChange(Number(e.target.value))}
                  className="pl-7"
                />
              </div>
              <Button
                variant="outline"
                type="button"
                onClick={() => onAmountPaidChange(total)}
                className="px-3"
                title="Full Payment"
              >
                Full
              </Button>
            </div>
          </div>
          
          {amountPaid > 0 && amountPaid < total && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Balance Due:</span>
              <span className="font-medium text-amber-600">
                ${(total - amountPaid).toFixed(2)}
              </span>
            </div>
          )}
          
          {amountPaid > total && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Change:</span>
              <span className="font-medium text-blue-600">
                ${(amountPaid - total).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}

      <Button
        onClick={onSubmit}
        className="w-full py-3 rounded-lg font-semibold cursor-pointer transition-colors disabled:cursor-not-allowed"
        disabled={!isValid || isPending}
      >
        {isPending ? (
          <>
            <Spinner className="mr-2 size-4" />
            {loadingLabel}
          </>
        ) : (
          ctaLabel
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
