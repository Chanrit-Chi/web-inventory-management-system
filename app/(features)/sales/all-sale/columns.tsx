"use client";

import { ColumnDef } from "@tanstack/react-table";
import { saleSchema } from "@/types/saleType";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const columns: ColumnDef<typeof saleSchema>[] = [
  {
    accessorKey: "index",
    header: ({ column }) => {
      return (
        <Button
          size={undefined}
          className="cursor-pointer"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "desc")}
        >
          No
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return <div>{row.index + 1}</div>;
    },
  },
  {
    accessorKey: "customer.name",
    header: ({ column }) => {
      return (
        <Button
          size={undefined}
          className="cursor-pointer"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Customer
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "totalPrice",
    header: "Total",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("totalPrice"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
      return formatted;
    },
  },
  {
    accessorKey: "discountAmount",
    header: "Discount",
    cell: ({ row }) => {
      const discountAmount = parseFloat(row.getValue("discountAmount"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(discountAmount);

      return formatted;
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          size={undefined}
          className="cursor-pointer"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status: string = row.getValue("status");
      let statusClass = "";
      if (status === "COMPLETED") {
        statusClass = "bg-green-100 text-green-800";
      } else if (status === "PENDING") {
        statusClass = "bg-yellow-100 text-yellow-800";
      } else {
        statusClass = "bg-red-100 text-red-800";
      }
      return (
        <span className={`px-2 py-1 rounded text-xs ${statusClass}`}>
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: "paymentMethod.name",
    header: ({ column }) => {
      return (
        <Button
          size={undefined}
          className="cursor-pointer"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Payment Via
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          size={undefined}
          className="cursor-pointer"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return date.toLocaleDateString();
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0" size={undefined}>
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="">
            <DropdownMenuLabel className="" inset={undefined}>
              Actions
            </DropdownMenuLabel>
            <DropdownMenuSeparator className={""} />
            <DropdownMenuItem className="cursor-pointer" inset={undefined}>
              Edit Order
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" inset={undefined}>
              View order
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" inset={undefined}>
              View customer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
