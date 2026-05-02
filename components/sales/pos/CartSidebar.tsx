import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CartItem as CartItemType } from "../../../app/(features)/sales/pos/types";
import { CartItem } from "./CartItem";
import { CreateCustomerDialog } from "../../../app/(features)/customer/customer-dialogs";

interface CartSidebarProps {
  cart: CartItemType[];
  customerId: string | null;
  onCustomerIdChange: (id: string | null) => void;
  paymentMethodId: number | null;
  onPaymentMethodIdChange: (id: number | null) => void;
  status: "COMPLETED" | "PENDING" | "CANCELLED";
  onStatusChange: (status: "COMPLETED" | "PENDING" | "CANCELLED") => void;
  discountPercent: number;
  onDiscountPercentChange: (value: number) => void;
  taxPercent: number;
  onTaxPercentChange: (value: number) => void;
  amountPaid: number | null;
  onAmountPaidChange: (value: number | null) => void;
  customers: any[];
  paymentMethods: any[];
  loadingCustomers: boolean;
  loadingPaymentMethods: boolean;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  onChangeQty: (productId: string, variantId: number, delta: number) => void;
  onCheckout: () => void;
  isProcessing: boolean;
  openCreateCustomer: boolean;
  setOpenCreateCustomer: (open: boolean) => void;
}

export function CartSidebar({
  cart,
  customerId,
  onCustomerIdChange,
  paymentMethodId,
  onPaymentMethodIdChange,
  status,
  onStatusChange,
  discountPercent,
  onDiscountPercentChange,
  taxPercent,
  onTaxPercentChange,
  amountPaid,
  onAmountPaidChange,
  customers,
  paymentMethods,
  loadingCustomers,
  loadingPaymentMethods,
  subtotal,
  discountAmount,
  taxAmount,
  total,
  onChangeQty,
  onCheckout,
  isProcessing,
  openCreateCustomer,
  setOpenCreateCustomer,
}: CartSidebarProps) {
  return (
    <div className="space-y-4 self-start pr-1 lg:fixed lg:right-0 lg:top-0 lg:w-[22rem] lg:h-screen lg:overflow-y-auto lg:border-l lg:bg-card lg:px-4 lg:py-6">
      <Button asChild variant="outline" className="w-full">
        <Link href="/sales/all-sale">
          <ArrowLeft className="size-4 mr-1" /> Back to Sale
        </Link>
      </Button>

      <div className="border rounded-xl p-4 bg-card space-y-3">
        <div>
          <Label>Customer</Label>
          <div className="flex gap-2 mt-1">
            <Select value={customerId ?? ""} onValueChange={onCustomerIdChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Customer</SelectLabel>
                  {loadingCustomers ? (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  ) : (
                    (customers || []).map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button type="button" onClick={() => setOpenCreateCustomer(true)}>
              <UserPlus className="size-4" />
            </Button>
            <CreateCustomerDialog
              open={openCreateCustomer}
              onOpenChange={setOpenCreateCustomer}
              onSuccess={(customer) => onCustomerIdChange(customer.id)}
            />
          </div>
        </div>

        <div>
          <Label>Payment Method</Label>
          <Select
            value={paymentMethodId ? String(paymentMethodId) : ""}
            onValueChange={(value) => onPaymentMethodIdChange(Number(value))}
          >
            <SelectTrigger className="mt-1 w-full">
              <SelectValue placeholder="Select payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Payment Method</SelectLabel>
                {loadingPaymentMethods ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : (
                  (paymentMethods || []).map((method) => (
                    <SelectItem key={method.id} value={String(method.id)}>
                      {method.name}
                    </SelectItem>
                  ))
                )}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(value) => onStatusChange(value as any)}
          >
            <SelectTrigger className="mt-1 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-xl p-4 bg-card space-y-3">
        <h2 className="font-semibold">Cart</h2>
        <div className="max-h-72 overflow-y-auto space-y-2">
          {cart.length === 0 && (
            <p className="text-sm text-muted-foreground">No items in cart</p>
          )}
          {cart.map((item) => (
            <CartItem key={`${item.productId}-${item.variantId}`} item={item} onChangeQty={onChangeQty} />
          ))}
        </div>

        <div className="space-y-2 pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Discount %</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(event) => onDiscountPercentChange(Number(event.target.value) || 0)}
              />
            </div>
            <div>
              <Label className="text-xs">Tax %</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={taxPercent}
                onChange={(event) => onTaxPercentChange(Number(event.target.value) || 0)}
              />
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span>Discount</span>
            <span>-${discountAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-base pt-1 border-t">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <div className="pt-2">
            <Label className="text-xs">Amount Paid</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  className="pl-5 text-xs h-8"
                  value={amountPaid === null ? "" : amountPaid}
                  onChange={(e) => onAmountPaidChange(e.target.value === "" ? null : Number(e.target.value))}
                />
              </div>
              <Button
                variant="outline"
                type="button"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => onAmountPaidChange(total)}
              >
                Full
              </Button>
            </div>
          </div>
          {amountPaid !== null && amountPaid < total && (
            <div className="flex justify-between text-xs text-amber-600 mt-1">
              <span>Balance Due</span>
              <span className="font-medium">${(total - amountPaid).toFixed(2)}</span>
            </div>
          )}
          {amountPaid !== null && amountPaid > total && (
            <div className="flex justify-between text-xs text-blue-600 mt-1">
              <span>Change</span>
              <span className="font-medium">${(amountPaid - total).toFixed(2)}</span>
            </div>
          )}
        </div>

        <Button
          className="w-full"
          onClick={onCheckout}
          disabled={isProcessing || cart.length === 0}
        >
          {isProcessing ? "Processing..." : "Process Transaction"}
        </Button>
      </div>
    </div>
  );
}
