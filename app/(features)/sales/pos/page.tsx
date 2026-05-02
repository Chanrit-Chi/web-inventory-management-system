"use client";

import { useState } from "react";
import { Search, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BarcodeScannerInput } from "@/components/barcode-scanner-input";
import { usePos } from "../../../../hooks/usePos";
import { CategoryTabs } from "../../../../components/sales/pos/CategoryTabs";
import { ProductCard } from "../../../../components/sales/pos/ProductCard";
import { CartSidebar } from "../../../../components/sales/pos/CartSidebar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

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
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-muted/20 pb-24 lg:pb-10">
      {/* Fixed Cart Sidebar for Desktop */}
      <div className="hidden lg:block">
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

      {/* Cart Sheet for Mobile */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-y-auto">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Cart & Checkout</SheetTitle>
          </SheetHeader>
          <div className="p-4">
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
              onCheckout={() => {
                checkout();
                setIsCartOpen(false);
              }}
              isProcessing={addSale.isPending}
              openCreateCustomer={openCreateCustomer}
              setOpenCreateCustomer={setOpenCreateCustomer}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content — offset right to not go under the fixed cart */}
      <div className="lg:pr-[23rem] px-4 py-6 space-y-6">
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

      {/* Bottom Bar for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t p-4 flex items-center justify-between z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground font-medium">
            {cart.length} {cart.length === 1 ? "item" : "items"}
          </span>
          <span className="font-bold text-lg text-primary">
            ${total.toFixed(2)}
          </span>
        </div>
        <Button 
          size="lg" 
          onClick={() => setIsCartOpen(true)}
          className="rounded-full px-8 shadow-lg"
        >
          <ShoppingCart className="size-5 mr-2" />
          View Cart
        </Button>
      </div>
    </div>
  );
}

export default function PosPage() {
  return <PosPageContent />;
}
