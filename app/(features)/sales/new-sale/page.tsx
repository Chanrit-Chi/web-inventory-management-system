"use client";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { ProductSearch } from "./ProductSearch";
import { OrderDetailsTable } from "./OrderDetailsTable";
import { OrderSummary } from "./OrderSummary";
import { useGetCustomers } from "@/hooks/useCustomer";
import { SharedLayout } from "@/components/shared-layout";
import { Select } from "@radix-ui/react-select";
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSaleMutations } from "@/hooks/useSale";
import Decimal from "decimal.js";
import { useGetProducts } from "@/hooks/useProduct";
import { useGetPaymentMethods } from "@/hooks/usePaymentMethod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { CreateCustomerDialog } from "./customer/customer-dialogs";

// Local types for UI state only
interface ProductForSale {
  id: string;
  name: string;
  price: number;
  stock: number;
  variantId: number;
}

interface SaleOrderDetail {
  productId: string;
  variantId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

function NewSalePage() {
  const { mutate: addSale, isPending } = useSaleMutations().addSale;
  const { data: customers, isLoading: isLoadingCustomers } = useGetCustomers();
  const { data: productsResponse, isLoading: isLoadingProducts } =
    useGetProducts(1, 100);
  const products = productsResponse?.data || []; // Fetch first 100 products for selection - TODO: implement pagination/search in ProductSearch component

  const [openCreateCustomer, setOpenCreateCustomer] = useState(false);
  // TODO: Create API endpoints and hooks for these
  const {
    data: paymentMethods,
    isLoading: isLoadingPaymentMethods,
    error: paymentMethodsError,
  } = useGetPaymentMethods();

  // Process products from database - handle both Decimal and number types
  const processedProducts: ProductForSale[] = products.flatMap((p: any) =>
    p.variants.map((variant: any) => {
      // Enhanced price processing with better Decimal handling
      let price = 0;

      // Try selling price first
      if (variant.sellingPrice !== null && variant.sellingPrice !== undefined) {
        if (typeof variant.sellingPrice === "number") {
          price = variant.sellingPrice;
        } else if (
          typeof variant.sellingPrice === "object" &&
          variant.sellingPrice.toNumber
        ) {
          price = variant.sellingPrice.toNumber();
        } else if (typeof variant.sellingPrice === "string") {
          price = parseFloat(variant.sellingPrice);
        }
      }

      // Fallback to cost price if selling price is 0 or invalid
      if (
        price === 0 &&
        variant.costPrice !== null &&
        variant.costPrice !== undefined
      ) {
        if (typeof variant.costPrice === "number") {
          price = variant.costPrice;
        } else if (
          typeof variant.costPrice === "object" &&
          variant.costPrice.toNumber
        ) {
          price = variant.costPrice.toNumber();
        } else if (typeof variant.costPrice === "string") {
          price = parseFloat(variant.costPrice);
        }
      }

      // Only log if price is 0 to debug the issue
      if (price === 0) {
        console.warn(
          `Product ${p.name} variant ${variant.id} has no price set. Both sellingPrice and costPrice are 0.`,
          {
            sellingPrice: variant.sellingPrice,
            costPrice: variant.costPrice,
            finalPrice: price,
          }
        );
      }

      return {
        id: p.id,
        name: p.name + (variant.name ? ` - ${variant.name}` : ""),
        price,
        stock: variant.stock || 0,
        variantId: variant.id,
      };
    })
  );

  const [customerId, setCustomerId] = useState<string | null>(null);
  const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);
  const [orderDetails, setOrderDetails] = useState<SaleOrderDetail[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(0);

  const handleAddProduct = (product: ProductForSale) => {
    const existingIndex = orderDetails.findIndex(
      (d) => d.productId === product.id && d.variantId === product.variantId
    );

    if (existingIndex >= 0) {
      const updated = [...orderDetails];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].subtotal =
        updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      setOrderDetails(updated);
    } else {
      setOrderDetails([
        ...orderDetails,
        {
          productId: product.id,
          variantId: product.variantId,
          productName: product.name,
          unitPrice: product.price,
          quantity: 1,
          subtotal: product.price,
        },
      ]);
    }
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) return;
    const updated = [...orderDetails];
    updated[index].quantity = quantity;
    updated[index].subtotal = quantity * updated[index].unitPrice;
    setOrderDetails(updated);
  };

  const handleRemoveProduct = (index: number) => {
    setOrderDetails(orderDetails.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return orderDetails.reduce((sum, detail) => sum + detail.subtotal, 0);
  };

  const calculateDiscount = () => {
    return (calculateSubtotal() * discountPercent) / 100;
  };

  const calculateTax = () => {
    return ((calculateSubtotal() - calculateDiscount()) * taxPercent) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount() + calculateTax();
  };

  const handleSubmit = () => {
    if (!customerId || !paymentMethodId || orderDetails.length === 0) {
      toast.error(
        "Please fill in all required fields and add at least one product"
      );
      return;
    }

    const saleData = {
      customerId: customerId,
      status: "COMPLETED" as const,
      paymentMethodId,
      totalPrice: new Decimal(calculateTotal()),
      discountPercent,
      discountAmount: new Decimal(calculateDiscount()),
      taxPercent,
      taxAmount: new Decimal(calculateTax()),
      orderDetails: orderDetails.map((detail) => ({
        productId: detail.productId,
        variantId: detail.variantId,
        unitPrice: new Decimal(detail.unitPrice),
        quantity: detail.quantity,
      })),
    };

    const toastId = toast.loading("Processing sale...");

    addSale(saleData, {
      onSuccess: () => {
        toast.success("Sale completed successfully!", { id: toastId });
        // Reset form
        setCustomerId(null);
        setPaymentMethodId(null);
        setOrderDetails([]);
        setDiscountPercent(0);
        setTaxPercent(0);
      },
      onError: (error) => {
        console.error("Error creating sale:", error);
        toast.error("Failed to complete sale. Please try again.", {
          id: toastId,
        });
      },
    });
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">New Sale</h1>
          <p className="text-muted-foreground mt-1">
            Create a new sale transaction
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card text-card-foreground rounded-lg p-6 border shadow">
              <h2 className="text-lg font-semibold mb-4">Sale Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          {isLoadingCustomers ? (
                            <SelectItem value="loading" disabled>
                              Loading...
                            </SelectItem>
                          ) : customers && customers.length > 0 ? (
                            customers.map((customer) => (
                              <SelectItem
                                key={customer.id}
                                value={String(customer.id)}
                              >
                                {customer.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="empty" disabled>
                              No customers found
                            </SelectItem>
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => setOpenCreateCustomer(true)}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
                      title="Add New Customer"
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
                        {isLoadingPaymentMethods ? (
                          <SelectItem value="loading" disabled>
                            Loading...
                          </SelectItem>
                        ) : paymentMethods && paymentMethods.length > 0 ? (
                          paymentMethods.map((method) => (
                            <SelectItem
                              key={method.id}
                              value={String(method.id)}
                            >
                              {method.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="empty" disabled>
                            No payment methods found
                          </SelectItem>
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="bg-card text-card-foreground rounded-lg border shadow p-6">
              <ProductSearch
                products={processedProducts}
                onAddProduct={handleAddProduct}
              />
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
              subtotal={calculateSubtotal()}
              discount={calculateDiscount()}
              tax={calculateTax()}
              total={calculateTotal()}
              onDiscountChange={setDiscountPercent}
              onTaxChange={setTaxPercent}
              onSubmit={handleSubmit}
              isValid={
                !!customerId &&
                !!paymentMethodId &&
                orderDetails.length > 0 &&
                !isPending
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewSale() {
  return (
    <SharedLayout>
      <NewSalePage />
    </SharedLayout>
  );
}
