"use client";

import { useState } from "react";
import { Plus, Minus, Search, Filter, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { SharedLayout } from "@/components/shared-layout";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
const img = "https://picsum.photos/200/300";

const POSOrderPage = () => {
  const [cart, setCart] = useState([
    {
      id: 1,
      name: "T-Shirt Zee Jkt48 X Senkanji",
      size: "L",
      price: 10.86,
      quantity: 1,
      image: img,
    },
    {
      id: 2,
      name: "Trucker Zee Jacket X JKT48",
      size: "M",
      price: 19.12,
      quantity: 2,
      image: img,
    },
    {
      id: 3,
      name: "Hoodie Fortune JKT48 Beige",
      size: "L",
      price: 31.95,
      quantity: 2,
      image: img,
    },
    {
      id: 4,
      name: "Paperbag",
      size: "Normal Size",
      price: 0.32,
      quantity: 1,
      image: img,
    },
  ]);

  const [activeCategory, setActiveCategory] = useState("All Items");
  const [selectedSizes, setSelectedSizes] = useState<Record<number, string>>(
    {}
  );

  const customer = [
    {
      name: "Prabowo Sasmito",
      phone: "xxxxxxxx",
    },
    {
      name: "Budi Santoso",
      phone: "xxxxxxxx",
    },
    {
      name: "Siti Aminah",
      phone: "xxxxxxxx",
    },
  ];

  const products = [
    {
      id: 1,
      name: "Hoodie Fortune JKT48 Beige",
      price: 31.95,
      sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
      image: img,
      category: "Hoodie",
    },
    {
      id: 2,
      name: "T-Shirt Zee Jkt48 X Senkanji",
      price: 10.86,
      sizes: ["S", "M", "L", "XL"],
      image: img,
      category: "Tshirt",
    },
    {
      id: 3,
      name: "T-Shirt Shani Jkt48 X Senkanji",
      price: 10.86,
      sizes: ["S", "M", "L", "XL"],
      image: img,
      category: "Tshirt",
    },
    {
      id: 4,
      name: "T-Shirt Christy Jkt48 X Senkanji",
      price: 19.17,
      sizes: ["S", "M", "L", "XL"],
      image: img,
      category: "Tshirt",
    },
    {
      id: 5,
      name: "T-Shirt Oversize Jkt48",
      price: 11.82,
      sizes: ["S", "M", "L", "XL"],
      image: img,
      category: "Tshirt",
    },
    {
      id: 6,
      name: "T-Shirt Oversize Jkt48 #11",
      price: 11.82,
      sizes: ["S", "M", "L", "XL"],
      image: img,
      category: "Tshirt",
    },
    {
      id: 7,
      name: "T-Shirt Oversize Jkt48 Red",
      price: 11.82,
      sizes: ["S", "M", "L", "XL"],
      image: img,
      category: "Tshirt",
    },
    {
      id: 8,
      name: "Hoodie Star Mocociu JKT48",
      price: 38.34,
      sizes: ["S", "M", "L", "XL"],
      image: img,
      category: "Hoodie",
    },
  ];

  const handleSizeSelect = (productId: number, size: string) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }));
  };

  const addToCart = (product: (typeof products)[0]) => {
    const selectedSize = selectedSizes[product.id] || product.sizes[0];

    const existingItemIndex = cart.findIndex(
      (item) => item.name === product.name && item.size === selectedSize
    );

    if (existingItemIndex > -1) {
      setCart(
        cart.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      const newItem = {
        id: Date.now(),
        name: product.name,
        size: selectedSize,
        price: product.price,
        quantity: 1,
        image: product.image,
      };
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(
      cart
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const filteredProducts =
    activeCategory === "All Items"
      ? products
      : products.filter((product) => product.category === activeCategory);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discount = 0;
  const tax = subtotal * 0.1;
  const total = subtotal - discount + tax;

  return (
    <SharedLayout>
      <div className="flex flex-col lg:flex-row h-screen bg-gray-50">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Products Section */}
          <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            <div className="mb-4 md:mb-6">
              <div className="flex items-center justify-between mb-4 gap-2">
                <h2 className="text-lg md:text-xl font-semibold text-slate-800">
                  Product
                </h2>
                <div className="flex items-center gap-2 md:gap-4">
                  <div className="relative hidden sm:block">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <input
                      type="text"
                      placeholder="Search..."
                      className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 w-32 md:w-auto"
                    />
                  </div>
                  <button className="p-2 border border-slate-200 rounded-lg hover:bg-gray-50">
                    <Filter size={18} />
                  </button>
                </div>
              </div>

              <div className="flex gap-2 md:gap-4 mb-4 md:mb-6 overflow-x-auto scrollbar-hide">
                {["All Items", "Hoodie", "Pants", "Tshirt"].map((category) => (
                  <Button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
                      activeCategory === category
                        ? "bg-slate-800 text-white"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl p-3 md:p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="bg-gray-100 rounded-lg mb-2 md:mb-3 h-32 sm:h-40 lg:h-48 flex items-center justify-center">
                    <Image
                      src={product.image}
                      width={200}
                      height={300}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <h3 className="font-medium text-slate-800 text-xs sm:text-sm mb-1 md:mb-2 line-clamp-2 truncate">
                    {product.name}
                  </h3>
                  <div className="text-base md:text-lg font-bold text-slate-900 mb-2 md:mb-3">
                    ${product.price}
                  </div>
                  <div className="flex flex-wrap gap-0.5 md:gap-1 mb-2 md:mb-3">
                    {product.sizes.map((size) => (
                      <Button
                        key={size}
                        onClick={() => handleSizeSelect(product.id, size)}
                        className={`flex-1 min-w-[28px] md:min-w-[32px] py-0 md:py-0.5 text-[9px] md:text-[10px] border rounded cursor-pointer transition-colors ${
                          selectedSizes[product.id] === size
                            ? "bg-slate-500 text-white border-slate-600"
                            : "border-slate-200 hover:bg-slate-600 hover:text-white"
                        }`}
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                  <Button
                    onClick={() => addToCart(product)}
                    className="w-full bg-primary text-white py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-1 md:gap-2 cursor-pointer"
                  >
                    <Plus size={14} className="md:hidden" />
                    <Plus size={16} className="hidden md:block" />
                    <span className="hidden sm:inline">Add</span>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Cart Button */}
        <div className="lg:hidden fixed bottom-4 right-4 z-50">
          <Sheet>
            <SheetTrigger asChild>
              <Button className="rounded-full h-14 w-14 shadow-lg bg-slate-800 hover:bg-slate-700">
                <div className="relative">
                  <ShoppingCart size={24} />
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cart.length}
                    </span>
                  )}
                </div>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-96 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Shopping Cart</SheetTitle>
              </SheetHeader>
              <OrderDetailsSidebar
                cart={cart}
                customer={customer}
                updateQuantity={updateQuantity}
                subtotal={subtotal}
                discount={discount}
                tax={tax}
                total={total}
              />
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Order Details Sidebar */}
        <div className="hidden lg:flex w-96 bg-white border-l flex-col">
          <OrderDetailsSidebar
            cart={cart}
            customer={customer}
            updateQuantity={updateQuantity}
            subtotal={subtotal}
            discount={discount}
            tax={tax}
            total={total}
          />
        </div>
      </div>
    </SharedLayout>
  );
};

// Order Details Component
const OrderDetailsSidebar = ({
  cart,
  customer,
  updateQuantity,
  subtotal,
  discount,
  tax,
  total,
}: any) => (
  <>
    <div className="p-4 md:p-6 border-b">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-semibold text-slate-800">
          Order Details
        </h2>
        <span className="text-sm text-slate-500">#666</span>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 md:p-4">
        <div className="text-xs md:text-sm text-slate-600 mb-2">
          Customer Information
        </div>
        <div className="flex items-center gap-3 justify-between">
          <div>
            <div className="font-medium text-sm md:text-base text-slate-800">
              {customer[0].name}
            </div>
            <div className="text-xs md:text-sm text-slate-500">
              Tel: {customer[0].phone}
            </div>
          </div>
          <div>
            <Button className="text-xs md:text-sm px-3 md:px-4 py-2">
              {customer[0].name ? "Change" : "Add"}
            </Button>
          </div>
        </div>
      </div>
    </div>

    <div className="flex-1 overflow-auto p-4 md:p-6">
      <h3 className="font-semibold text-slate-800 mb-4">Items</h3>
      <div className="space-y-4">
        {cart.map((item: any) => (
          <div key={item.id} className="flex gap-3">
            <div className="w-12 h-16 md:w-16 md:h-20 bg-gray-100 rounded-lg shrink-0">
              <Image
                src={item.image}
                width={200}
                height={300}
                alt={item.name}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-xs md:text-sm text-slate-800 mb-1">
                {item.name}
              </h4>
              <div className="text-xs text-slate-500 mb-2">
                Size {item.size}
              </div>
              <div className="font-bold text-sm md:text-base text-slate-900">
                ${item.price}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center justify-center gap-1 md:gap-2 bg-gray-100 rounded-full p-0.5">
                <Button
                  onClick={() => updateQuantity(item.id, -1)}
                  className="rounded-full size-6 md:size-8 p-0"
                >
                  <Minus size={12} className="md:hidden" />
                  <Minus size={14} className="hidden md:block" />
                </Button>
                <span className="text-xs md:text-sm font-medium w-5 md:w-6 text-center">
                  {item.quantity}
                </span>
                <Button
                  onClick={() => updateQuantity(item.id, 1)}
                  className="rounded-full size-6 md:size-8 p-0"
                >
                  <Plus size={12} className="md:hidden" />
                  <Plus size={14} className="hidden md:block" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="border-t p-4 md:p-6">
      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-xs md:text-sm">
          <span className="text-slate-600">Item</span>
          <span className="font-medium">{cart.length} Items</span>
        </div>
        <div className="flex justify-between text-xs md:text-sm">
          <span className="text-slate-600">Sub Total</span>
          <span className="font-medium">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs md:text-sm">
          <span className="text-slate-600">Membership Discount</span>
          <span className="font-medium text-red-500">
            -${discount.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-xs md:text-sm">
          <span className="text-slate-600">Tax (10%)</span>
          <span className="font-medium">${tax.toFixed(2)}</span>
        </div>
        <div className="border-t pt-3 flex justify-between">
          <span className="font-semibold text-sm md:text-base text-slate-800">
            Total
          </span>
          <span className="font-bold text-lg md:text-xl text-slate-900">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>

      <Button className="w-full bg-slate-800 text-white py-2.5 md:py-3 rounded-lg text-sm md:text-base font-semibold hover:bg-slate-700 transition-colors">
        Process Transaction
      </Button>
    </div>
  </>
);

export default POSOrderPage;
