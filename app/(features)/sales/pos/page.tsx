"use client";

import { useState } from "react";
import { Search, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BarcodeScannerInput } from "@/components/barcode-scanner-input";
import { usePos } from "../../../../hooks/usePos";
import { CategoryTabs } from "../../../../components/sales/pos/CategoryTabs";
import { ProductCard } from "../../../../components/sales/pos/ProductCard";
import { CartSidebar } from "../../../../components/sales/pos/CartSidebar";

function PosPageContent() {
  const {
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    selectedVariantByProduct,
    selectedSizeByProduct,
    selectedColorByProduct,
    cart,
    customerId,
    setCustomerId,
    paymentMethodId,
    setPaymentMethodId,
    status,
    setStatus,
    discountPercent,
    setDiscountPercent,
    taxPercent,
    setTaxPercent,
    amountPaid,
    setAmountPaid,
    loadingProducts,
    loadingCustomers,
    loadingPaymentMethods,
    customers,
    categoryTabs,
    filteredProducts,
    subtotal,
    discountAmount,
    taxAmount,
    total,
    paymentMethods,
    addSale,
    selectSize,
    selectColor,
    selectVariant,
    addToCart,
    changeQty,
    handleBarcodeScan,
    checkout,
  } = usePos();

  const [openCreateCustomer, setOpenCreateCustomer] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-muted/20 pb-10">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr,20rem] gap-8">
          {/* Main Content */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ShoppingCart className="size-6 text-primary" />
                Point of Sale
              </h1>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="w-full sm:w-64">
                  <BarcodeScannerInput
                    onScan={handleBarcodeScan}
                    placeholder="Scan barcode..."
                  />
                </div>
              </div>
            </div>

            <CategoryTabs
              categories={categoryTabs}
              selectedId={selectedCategory}
              onSelect={setSelectedCategory}
            />

            {loadingProducts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-64 rounded-xl bg-card border animate-pulse"
                  />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-xl border border-dashed">
                <p className="text-muted-foreground">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    selectedVariantId={selectedVariantByProduct[product.id]}
                    selectedSizeKey={selectedSizeByProduct[product.id]}
                    selectedColorKey={selectedColorByProduct[product.id]}
                    onSelectSize={selectSize}
                    onSelectColor={selectColor}
                    onSelectVariant={selectVariant}
                    onAddToCart={addToCart}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Cart Sidebar */}
          <CartSidebar
            cart={cart}
            customerId={customerId}
            onCustomerIdChange={setCustomerId}
            paymentMethodId={paymentMethodId}
            onPaymentMethodIdChange={setPaymentMethodId}
            status={status}
            onStatusChange={setStatus}
            discountPercent={discountPercent}
            onDiscountPercentChange={setDiscountPercent}
            taxPercent={taxPercent}
            onTaxPercentChange={setTaxPercent}
            amountPaid={amountPaid}
            onAmountPaidChange={setAmountPaid}
            customers={customers ?? []}
            paymentMethods={paymentMethods ?? []}
            loadingCustomers={loadingCustomers}
            loadingPaymentMethods={loadingPaymentMethods}
            subtotal={subtotal}
            discountAmount={discountAmount}
            taxAmount={taxAmount}
            total={total}
            onChangeQty={changeQty}
            onCheckout={checkout}
            isProcessing={addSale.isPending}
            openCreateCustomer={openCreateCustomer}
            setOpenCreateCustomer={setOpenCreateCustomer}
          />
        </div>
      </div>
    </div>
  );
}

export default function PosPage() {
  return <PosPageContent />;
}
