"use client";

import { useMemo, useState } from "react";
import Decimal from "decimal.js";
import { toast } from "sonner";
import { UserPlus, ArrowRightLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ProductSearch,
  type ProductForSale,
} from "../components/ProductSearch";
import {
  OrderDetailsTable,
  type SaleOrderDetail,
} from "../components/OrderDetailsTable";
import { OrderSummary } from "../components/OrderSummary";
import { CreateCustomerDialog } from "../../customer/customer-dialogs";
import { useGetCustomers } from "@/hooks/useCustomer";
import { useGetPaymentMethods } from "@/hooks/usePaymentMethod";
import { useSaleMutations } from "@/hooks/useSale";
import {
  Order,
  OrderUpdate,
  type OrderWithDetails,
} from "@/schemas/type-export.schema";

interface SaleVariantAttribute {
  value?: {
    attribute?: { name?: string | null } | null;
    value?: string | null;
  } | null;
}

interface SaleVariant {
  sku?: string | null;
  stock?: number | null;
  attributes?: SaleVariantAttribute[] | null;
}

interface SaleOrderDetailResponse {
  productId: string;
  variantId: number;
  quantity: number;
  unitPrice: Decimal.Value | { toNumber?: () => number } | string | number;
  product?: {
    name?: string | null;
    image?: string | null;
  } | null;
  variant?: SaleVariant | null;
}

export type SaleWithDetailsResponse = Order & {
  orderDetail?: SaleOrderDetailResponse[];
};

interface SaleFormProps {
  mode: "create" | "edit";
  sale?: SaleWithDetailsResponse | null;
  saleId?: number;
  onSuccess?: () => void;
}

type SaleUpdatePayload = OrderUpdate & Pick<OrderWithDetails, "orderDetails">;

type NumericLike =
  | Decimal.Value
  | { toNumber?: () => number }
  | string
  | number
  | null
  | undefined;

const decimalToNumber = (value: NumericLike): number => {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  if (value instanceof Decimal) {
    return value.toNumber();
  }

  if (typeof value === "object" && typeof value.toNumber === "function") {
    return value.toNumber();
  }

  return Number(value);
};

const buildVariantDescription = (variant?: SaleVariant | null) => {
  if (!variant?.attributes?.length) {
    return "";
  }

  const parts = variant.attributes
    .map((attr) => {
      const attributeName = attr.value?.attribute?.name;
      const attributeValue = attr.value?.value;
      if (!attributeName || !attributeValue) {
        return "";
      }
      return `${attributeName}: ${attributeValue}`;
    })
    .filter(Boolean);

  return parts.join(" ");
};

const mapSaleDetailsToOrderDetails = (
  sale?: SaleWithDetailsResponse | null,
): SaleOrderDetail[] => {
  if (!sale?.orderDetail?.length) {
    return [];
  }

  return sale.orderDetail.map((detail) => {
    const unitPrice = decimalToNumber(detail.unitPrice);
    const variantDescription = buildVariantDescription(detail.variant);
    const baseName = detail.product?.name || "Product";
    let productName = baseName;

    if (variantDescription) {
      productName = `${baseName} - ${variantDescription}`;
    } else if (detail.variant?.sku) {
      productName = `${baseName} (${detail.variant.sku})`;
    }

    return {
      productId: detail.productId,
      variantId: detail.variantId,
      productName,
      unitPrice,
      quantity: detail.quantity,
      subtotal: unitPrice * detail.quantity,
      stock: (detail.variant?.stock ?? 0) + detail.quantity,
      image: detail.product?.image || undefined,
    };
  });
};

export function SaleForm({
  mode,
  sale,
  saleId,
  onSuccess,
}: Readonly<SaleFormProps>) {
  const { addSale, updateSale } = useSaleMutations();
  const { data: customers, isLoading: isLoadingCustomers } = useGetCustomers();
  const { data: paymentMethods, isLoading: isLoadingPaymentMethods } =
    useGetPaymentMethods();

  const [customerId, setCustomerId] = useState<string | null>(() =>
    mode === "edit" && sale ? (sale.customerId ?? null) : null,
  );
  const [paymentMethodId, setPaymentMethodId] = useState<number | null>(() =>
    mode === "edit" && sale ? (sale.paymentMethodId ?? null) : null,
  );
  const [orderDetails, setOrderDetails] = useState<SaleOrderDetail[]>(() =>
    mode === "edit" && sale ? mapSaleDetailsToOrderDetails(sale) : [],
  );
  const [discountPercent, setDiscountPercent] = useState<number>(() =>
    mode === "edit" && sale ? (sale.discountPercent ?? 0) : 0,
  );
  const [taxPercent, setTaxPercent] = useState<number>(() =>
    mode === "edit" && sale ? (sale.taxPercent ?? 0) : 0,
  );
  const [status, setStatus] = useState<"COMPLETED" | "PENDING" | "CANCELLED">(
    () =>
      mode === "edit" && sale ? (sale.status ?? "COMPLETED") : "COMPLETED",
  );
  const [openCreateCustomer, setOpenCreateCustomer] = useState(false);

  const handleAddProduct = (product: ProductForSale) => {
    setOrderDetails((current) => {
      const existingIndex = current.findIndex(
        (detail) =>
          detail.productId === product.id &&
          detail.variantId === product.variantId,
      );

      if (existingIndex >= 0) {
        const updated = [...current];
        const item = updated[existingIndex];
        const maxQuantity = item.stock ?? Infinity;

        if (item.quantity < maxQuantity) {
          item.quantity += 1;
          item.subtotal = item.quantity * item.unitPrice;
        } else {
          toast.error(
            `Maximum available stock reached for ${item.productName}`,
          );
        }
        return updated;
      }

      return [
        ...current,
        {
          productId: product.id,
          variantId: product.variantId,
          productName: product.name,
          unitPrice: product.price,
          quantity: 1,
          subtotal: product.price,
          stock: product.stock,
          image: product.image,
        },
      ];
    });
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) return;

    setOrderDetails((current) => {
      const updated = [...current];
      const item = updated[index];
      const maxQuantity = item.stock ?? Infinity;

      if (quantity > maxQuantity) {
        toast.error(`Maximum available stock is ${maxQuantity}`);
        item.quantity = maxQuantity;
      } else {
        item.quantity = quantity;
      }

      item.subtotal = item.quantity * item.unitPrice;
      return updated;
    });
  };

  const handleRemoveProduct = (index: number) => {
    setOrderDetails((current) => current.filter((_, i) => i !== index));
  };

  const subtotal = useMemo(
    () => orderDetails.reduce((sum, detail) => sum + detail.subtotal, 0),
    [orderDetails],
  );

  const discountAmount = useMemo(
    () => (subtotal * discountPercent) / 100,
    [discountPercent, subtotal],
  );

  const taxAmount = useMemo(
    () => ((subtotal - discountAmount) * taxPercent) / 100,
    [discountAmount, subtotal, taxPercent],
  );

  const total = useMemo(
    () => subtotal - discountAmount + taxAmount,
    [discountAmount, subtotal, taxAmount],
  );

  const isPending = mode === "edit" ? updateSale.isPending : addSale.isPending;

  const resetForm = () => {
    setCustomerId(null);
    setPaymentMethodId(null);
    setOrderDetails([]);
    setDiscountPercent(0);
    setTaxPercent(0);
  };

  const handleSubmit = () => {
    if (
      !customerId ||
      customerId.length < 10 ||
      !paymentMethodId ||
      orderDetails.length === 0
    ) {
      toast.error(
        "Please select a valid customer and fill in all required fields",
      );
      return;
    }

    const salePayload: OrderWithDetails = {
      customerId,
      status,
      paymentMethodId,
      totalPrice: new Decimal(total),
      discountPercent,
      discountAmount: new Decimal(discountAmount),
      taxPercent,
      taxAmount: new Decimal(taxAmount),
      orderDetails: orderDetails.map((detail) => ({
        productId: detail.productId,
        variantId: detail.variantId,
        unitPrice: new Decimal(detail.unitPrice),
        quantity: detail.quantity,
      })),
      createdAt:
        mode === "edit" && sale?.createdAt ? sale.createdAt : new Date(),
      updatedAt: new Date(),
    };

    if (mode === "edit") {
      const resolvedSaleId = saleId ?? sale?.id;
      if (!resolvedSaleId) {
        toast.error("Unable to determine which sale to update.");
        return;
      }

      const toastId = toast.loading("Updating sale...");
      updateSale.mutate(
        {
          id: resolvedSaleId,
          ...salePayload,
        } as SaleUpdatePayload,
        {
          onSuccess: () => {
            toast.success("Sale updated successfully!", { id: toastId });
            onSuccess?.();
          },
          onError: (error: Error) => {
            console.error("Error updating sale:", error);
            const message =
              error.message || "Failed to update sale. Please try again.";
            toast.error(message, {
              id: toastId,
            });
          },
        },
      );
      return;
    }

    const toastId = toast.loading("Processing sale...");
    addSale.mutate(salePayload, {
      onSuccess: () => {
        toast.success("Sale completed successfully!", { id: toastId });
        resetForm();
        onSuccess?.();
      },
      onError: (error: Error) => {
        console.error("Error creating sale:", error);
        const message =
          error.message || "Failed to complete sale. Please try again.";
        toast.error(message, {
          id: toastId,
        });
      },
    });
  };

  const isFormValid =
    !!customerId && !!paymentMethodId && orderDetails.length > 0 && !isPending;

  const title = mode === "edit" ? "Edit Sale" : "New Sale";
  const subtitle =
    mode === "edit"
      ? "Update the sale transaction details"
      : "Create a new sale transaction";
  const ctaLabel = mode === "edit" ? "Update Sale" : "Complete Sale";

  const renderCustomerOptions = () => {
    if (isLoadingCustomers) {
      return (
        <SelectItem value="loading" disabled>
          Loading...
        </SelectItem>
      );
    }

    if (customers && customers.length > 0) {
      return customers.map((customer) => (
        <SelectItem key={customer.id} value={String(customer.id)}>
          {customer.name}
        </SelectItem>
      ));
    }

    return (
      <SelectItem value="empty" disabled>
        No customers found
      </SelectItem>
    );
  };

  const renderPaymentMethodOptions = () => {
    if (isLoadingPaymentMethods) {
      return (
        <SelectItem value="loading" disabled>
          Loading...
        </SelectItem>
      );
    }

    if (paymentMethods && paymentMethods.length > 0) {
      return paymentMethods.map((method) => (
        <SelectItem key={method.id} value={String(method.id)}>
          {method.name}
        </SelectItem>
      ));
    }

    return (
      <SelectItem value="empty" disabled>
        No payment methods found
      </SelectItem>
    );
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="mb-6">
          <div className="flex gap-2 items-center">
            <ArrowRightLeft className="size-6 text-green-500" />
            <h1 className="text-2xl font-bold">{title}</h1>
          </div>
          <p className="text-muted-foreground mt-1">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card text-card-foreground rounded-lg p-6 border shadow">
              <h2 className="text-lg font-semibold mb-4">Sale Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label className="block text-sm font-medium mb-2">
                    Customer <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      value={customerId ?? ""}
                      onValueChange={(value) => setCustomerId(value)}
                    >
                      <SelectTrigger className="w-45">
                        <SelectValue placeholder="Select Customer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Select Customer</SelectLabel>
                          {renderCustomerOptions()}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => setOpenCreateCustomer(true)}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
                      title="Add New Customer"
                      type="button"
                    >
                      <UserPlus size={20} />
                    </Button>
                    <CreateCustomerDialog
                      open={openCreateCustomer}
                      onOpenChange={setOpenCreateCustomer}
                      onSuccess={(customer) => setCustomerId(customer.id)}
                    />
                  </div>
                </div>
                <div>
                  <Label className="block text-sm font-medium mb-2">
                    Payment Method <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={paymentMethodId ? String(paymentMethodId) : ""}
                    onValueChange={(value) => setPaymentMethodId(Number(value))}
                  >
                    <SelectTrigger className="w-45">
                      <SelectValue placeholder="Select Payment Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Select Payment Method</SelectLabel>
                        {renderPaymentMethodOptions()}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="block text-sm font-medium mb-2">
                    Status <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={status}
                    onValueChange={(value) =>
                      setStatus(value as "COMPLETED" | "PENDING" | "CANCELLED")
                    }
                  >
                    <SelectTrigger className="w-45">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Select Status</SelectLabel>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="bg-card text-card-foreground rounded-lg border shadow p-6">
              <ProductSearch onAddProduct={handleAddProduct} />
              <OrderDetailsTable
                orderDetails={orderDetails}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveProduct={handleRemoveProduct}
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            <OrderSummary
              isPending={isPending}
              discountPercent={discountPercent}
              taxPercent={taxPercent}
              subtotal={subtotal}
              discount={discountAmount}
              tax={taxAmount}
              total={total}
              onDiscountChange={setDiscountPercent}
              onTaxChange={setTaxPercent}
              onSubmit={handleSubmit}
              isValid={isFormValid}
              ctaLabel={ctaLabel}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
