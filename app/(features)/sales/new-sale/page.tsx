"use client";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { CustomerSelector } from "./CustomerSelector";
import { ProductSearch } from "./ProductSearch";
import { OrderDetailsTable } from "./OrderDetailsTable";
import { OrderSummary } from "./OrderSummary";
import { useCustomerMutations, useGetCustomers } from "@/hooks/useCustomer";
import { useRouter } from "next/navigation";
import type { CustomerCreate } from "@/schemas/type-export.schema";
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

// Local types for UI state only
interface ProductForSale {
  id: string;
  name: string;
  price: number;
  stock: number;
  variantId: number;
}

interface PaymentMethod {
  id: number;
  name: string;
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
  const router = useRouter();
  const { mutate: addSale, isPending } = useSaleMutations().addSale;
  const { mutate: createCustomer } = useCustomerMutations().addCustomer;
  const { data: customers = [], isLoading: isLoadingCustomers } =
    useGetCustomers();

  // TODO: Create API endpoints and hooks for these
  const mockPaymentMethods: PaymentMethod[] = [
    { id: 1, name: "ABA" },
    { id: 2, name: "Cash" },
    { id: 3, name: "Credit Card" },
  ];

  // TODO: Replace with useGetProducts() hook
  const mockProducts: ProductForSale[] = [
    {
      id: "1",
      name: "Product A",
      price: 50.0,
      stock: 100,
      variantId: 1,
    },
    {
      id: "2",
      name: "Product B",
      price: 75.0,
      stock: 50,
      variantId: 2,
    },
  ];

  const [customerId, setCustomerId] = useState<string | null>(null);
  const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);
  const [orderDetails, setOrderDetails] = useState<SaleOrderDetail[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(0);

  const handleAddCustomer = (newCustomer: CustomerCreate) => {
    createCustomer(newCustomer, {
      onSuccess: (data) => {
        setCustomerId(data.id);
      },
    });
  };

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
      alert("Please fill in all required fields and add at least one product");
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
        unitPrice: detail.unitPrice,
        quantity: detail.quantity,
        orderId: 0, // Placeholder, will be set by the backend
      })),
    };

    addSale(saleData, {
      onSuccess: () => {
        // Reset form
        setCustomerId(null);
        setPaymentMethodId(null);
        setOrderDetails([]);
        setDiscountPercent(0);
        setTaxPercent(0);
        //  redirect to sales list
        // router.push("/sales");
      },
      onError: (error) => {
        console.error("Error creating sale:", error);
      },
    });
  };

  return (
    <div className="min-h-screen">
      <div className="w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">New Sale</h1>
          <p className="text-muted-foreground mt-1">
            Create a new sale transaction
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card text-card-foreground rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Sale Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CustomerSelector
                  customers={customers}
                  customerId={customerId}
                  onCustomerChange={setCustomerId}
                  onAddCustomer={handleAddCustomer}
                />
                <div>
                  <Label className="block text-sm font-medium mb-2">
                    Payment Method <span className="text-red-500">*</span>
                  </Label>
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Payment Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Select Payment Method</SelectLabel>
                        {mockPaymentMethods.map((method) => (
                          <SelectItem key={method.id} value={String(method.id)}>
                            {method.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="bg-card text-card-foreground rounded-lg shadow p-6">
              <ProductSearch
                products={mockProducts}
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
