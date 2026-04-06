"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FileText, UserPlus } from "lucide-react";
import { addDays, format } from "date-fns";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
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
import { useQuotationMutations } from "@/hooks/useQuotation";
import { QuotationWithItems } from "@/schemas/type-export.schema";
import { QuotationStatus } from "@prisma/client";

interface QuotationFormProps {
  readonly mode: "create" | "edit";
  readonly quotation?: QuotationWithItems;
  readonly quotationId?: string;
  readonly onSuccess?: () => void;
}

export function QuotationForm({
  mode,
  quotation,
  quotationId,
  onSuccess,
}: QuotationFormProps) {
  const { addQuotation, updateQuotation } = useQuotationMutations();
  const { data: customers } = useGetCustomers();

  const [customerId, setCustomerId] = useState<string | null>(() =>
    mode === "edit" && quotation ? quotation.customerId : null,
  );
  const [orderDetails, setOrderDetails] = useState<SaleOrderDetail[]>(() =>
    mode === "edit" && quotation
      ? quotation.quotationItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId || 0,
          productName: item.productName,
          unitPrice: Number(item.unitPrice),
          quantity: item.quantity,
          subtotal: Number(item.lineTotal),
        }))
      : [],
  );
  const [discountPercent, setDiscountPercent] = useState<number>(() =>
    mode === "edit" && quotation ? quotation.discountPercent : 0,
  );
  const [taxPercent, setTaxPercent] = useState<number>(() =>
    mode === "edit" && quotation ? quotation.taxPercent : 0,
  );
  const [status, setStatus] = useState<QuotationStatus>(() =>
    mode === "edit" && quotation ? quotation.status : "DRAFT",
  );
  const [validUntil, setValidUntil] = useState<string>(() =>
    mode === "edit" && quotation
      ? format(new Date(quotation.validUntil), "yyyy-MM-dd")
      : format(addDays(new Date(), 30), "yyyy-MM-dd"),
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
        updated[existingIndex].quantity += 1;
        updated[existingIndex].subtotal =
          updated[existingIndex].quantity * updated[existingIndex].unitPrice;
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
        },
      ];
    });
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) return;
    setOrderDetails((current) => {
      const updated = [...current];
      updated[index].quantity = quantity;
      updated[index].subtotal = quantity * updated[index].unitPrice;
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

  const isPending =
    mode === "edit" ? updateQuotation.isPending : addQuotation.isPending;

  const handleSubmit = () => {
    if (!customerId || orderDetails.length === 0) {
      toast.error("Please select a valid customer and add products");
      return;
    }

    // Use input type for payload construction
    const payload = {
      customerId,
      status,
      issueDate: new Date(),
      validUntil: new Date(validUntil),
      subtotal: subtotal,
      discountPercent,
      discountAmount: discountAmount,
      taxPercent,
      taxAmount: taxAmount,
      totalAmount: total,
      quotationItems: orderDetails.map((detail) => ({
        quotationId: quotationId || "",
        productId: detail.productId,
        productName: detail.productName,
        variantId: detail.variantId,
        sku: "SKU",
        quantity: detail.quantity,
        unitPrice: detail.unitPrice,
        lineTotal: detail.subtotal,
      })),
      quotationNumber: mode === "edit" ? quotation?.quotationNumber || "" : "",
    };

    if (mode === "edit") {
      updateQuotation.mutate(
        { id: quotationId!, ...(payload as unknown as Partial<QuotationWithItems>) },
        {
          onSuccess: () => {
            toast.success("Quotation updated successfully");
            onSuccess?.();
          },
          onError: (err: Error) => toast.error(err.message),
        },
      );
    } else {
      addQuotation.mutate(payload as unknown as QuotationWithItems, {
        onSuccess: () => {
          toast.success("Quotation created successfully");
          onSuccess?.();
        },
        onError: (err: Error) => toast.error(err.message),
      });
    }
  };

  const isFormValid = !!customerId && orderDetails.length > 0;

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="flex gap-2 items-center mb-6">
          <FileText className="size-6 text-blue-500" />
          <h1 className="text-2xl font-bold">
            {mode === "edit" ? "Edit Quotation" : "New Quotation"}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card text-card-foreground rounded-lg p-6 border shadow">
              <h2 className="text-lg font-semibold mb-4">Quotation Info</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-sm font-medium mb-2">
                    Customer
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      value={customerId ?? ""}
                      onValueChange={setCustomerId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => setOpenCreateCustomer(true)}
                      type="button"
                    >
                      <UserPlus size={20} />
                    </Button>
                    <CreateCustomerDialog
                      open={openCreateCustomer}
                      onOpenChange={setOpenCreateCustomer}
                      onSuccess={(c) => setCustomerId(c.id)}
                    />
                  </div>
                </div>
                <div>
                  <Label className="block text-sm font-medium mb-2">
                    Valid Until
                  </Label>
                  <Input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium mb-2">
                    Status
                  </Label>
                  <Select
                    value={status}
                    onValueChange={(v: QuotationStatus) => setStatus(v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="SENT">Sent</SelectItem>
                      <SelectItem value="ACCEPTED">Accepted</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                      {mode === "edit" && (
                        <SelectItem value="CONVERTED">Converted</SelectItem>
                      )}
                      {mode === "edit" && (
                        <SelectItem value="EXPIRED">Expired</SelectItem>
                      )}
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
              ctaLabel={
                mode === "edit" ? "Update Quotation" : "Create Quotation"
              }
              loadingLabel={mode === "edit" ? "Updating..." : "Creating..."}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
