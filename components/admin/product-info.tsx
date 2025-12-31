import React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Boxes, CalendarDays, CircleAlert } from "lucide-react";
import Link from "next/link";
import { Separator } from "../ui/separator";
import Image from "next/image";

const products = [
  {
    id: 1,
    image: "https://picsum.photos/200",
    name: "Product A",
    amountSold: 29.99,
    quantity: 150,
    stockInHand: 20,
  },
  {
    id: 2,
    image: "https://picsum.photos/200",
    name: "Product B",
    amountSold: 49.99,
    quantity: 75,
    stockInHand: 5,
  },
  {
    id: 3,
    image: "https://picsum.photos/200",
    name: "Product C",
    amountSold: 19.99,
    quantity: 200,
    stockInHand: 9,
  },
  {
    id: 4,
    image: "https://picsum.photos/200",
    name: "Product D",
    amountSold: 99.99,
    quantity: 40,
    stockInHand: 0,
  },
  {
    id: 5,
    image: "https://picsum.photos/200",
    name: "Product E",
    amountSold: 59.99,
    quantity: 100,
    stockInHand: 3,
  },
  {
    id: 6,
    image: "https://picsum.photos/200",
    name: "Product F",
    amountSold: 39.99,
    quantity: 80,
    stockInHand: 15,
  },
  {
    id: 7,
    image: "https://picsum.photos/200",
    name: "Product G",
    amountSold: 79.99,
    quantity: 60,
    stockInHand: 8,
  },
];

const recentSales = [
  {
    id: 1,
    image: "https://picsum.photos/200",
    name: "Product A",
    amountSold: 29.99,
    dateSold: "2025-11-04",
    status: "Completed",
  },
  {
    id: 2,
    image: "https://picsum.photos/200",
    name: "Product B",
    amountSold: 49.99,
    dateSold: "2025-11-03",
    status: "Pending",
  },
  {
    id: 3,
    image: "https://picsum.photos/200",
    name: "Product C",
    amountSold: 19.99,
    dateSold: "2025-10-30",
    status: "Completed",
  },
  {
    id: 4,
    image: "https://picsum.photos/200",
    name: "Product D",
    amountSold: 99.99,
    dateSold: "2025-10-25",
    status: "Pending",
  },
  {
    id: 5,
    image: "https://picsum.photos/200",
    name: "Product E",
    amountSold: 59.99,
    dateSold: "2025-10-15",
    status: "Canceled",
  },
  {
    id: 6,
    image: "https://picsum.photos/200",
    name: "Product F",
    amountSold: 39.99,
    dateSold: "2025-10-12",
    status: "Completed",
  },
  {
    id: 7,
    image: "https://picsum.photos/200",
    name: "Product G",
    amountSold: 79.99,
    dateSold: "2025-10-11",
    status: "Pending",
  },
];

export default function ProductInfo() {
  const sortProducts = products.toSorted((a, b) => a.amountSold - b.amountSold);
  const lowStockProducts = products.filter(
    (product) => product.stockInHand < 10
  );

  const formatDateDisplay = (dateString: string) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const inputDate = new Date(dateString);

    // Format dates to compare (YYYY-MM-DD)
    const todayStr = today.toISOString().split("T")[0];
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const inputDateStr = inputDate.toISOString().split("T")[0];

    if (inputDateStr === todayStr) {
      return "Today";
    } else if (inputDateStr === yesterdayStr) {
      return "Yesterday";
    } else {
      return inputDate.toISOString().split("T")[0];
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "canceled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div>
      <div className="grid auto-rows-min gap-4 lg:grid-cols-3 mt-4">
        <div className="p-4 bg-background rounded-lg border">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Boxes className="h-4 w-4 text-red-400" />
              <h4 className="font-bold">Top Selling Products</h4>
            </div>
            <Select defaultValue="today">
              <SelectTrigger className="w-auto min-w-[120px]">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <SelectValue placeholder="Today" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Date</SelectLabel>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <Separator className="my-3" />
          <div className="space-y-2">
            {sortProducts.slice(0, 5).map((product) => (
              <div key={product.id} className="flex items-center gap-3">
                <Image
                  src={product.image}
                  alt={product.name}
                  width={40}
                  height={40}
                  className="rounded-md object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.quantity}+ Sold
                  </p>
                </div>
                <p className="text-sm font-semibold">${product.amountSold}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 bg-background rounded-lg border">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <CircleAlert className="h-4 w-4 text-yellow-400" />
              <h4 className="font-bold">Low Stock Products</h4>
            </div>
            <div className="h-10 flex items-center justify-center px-3 py-2 border rounded-md bg-background min-w-[120px]">
              <Link href="/#" className="text-sm text-primary underline">
                View Details
              </Link>
            </div>
          </div>
          <Separator className="my-3" />
          <div className="space-y-2">
            {lowStockProducts.slice(0, 5).map((product) => (
              <div key={product.id} className="flex items-center gap-3">
                <Image
                  src={product.image}
                  alt={product.name}
                  width={40}
                  height={40}
                  className="rounded-md object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    ID: #{product.id}
                  </p>
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-semibold">In stock</p>
                  <p className="text-xs text-red-500">
                    {product.stockInHand} left
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 bg-background rounded-lg border">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Boxes className="h-4 w-4 text-red-400" />
              <h4 className="font-bold">Recent Sales</h4>
            </div>
            <Select defaultValue="today">
              <SelectTrigger className="w-auto min-w-[120px]">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <SelectValue placeholder="Today" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Date</SelectLabel>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <Separator className="my-3" />
          <div className="space-y-2">
            {recentSales.slice(0, 5).map((product) => (
              <div key={product.id} className="flex items-center gap-3">
                <Image
                  src={product.image}
                  alt={product.name}
                  width={40}
                  height={40}
                  className="rounded-md object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    ${product.amountSold}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <p className="text-sm">
                    {formatDateDisplay(product.dateSold)}
                  </p>
                  <span
                    className={`text-xs px-2 rounded-full border ${getStatusStyles(
                      product.status
                    )}`}
                  >
                    {product.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
