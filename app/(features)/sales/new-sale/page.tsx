"use client";

import { SharedLayout } from "@/components/shared-layout";

import { SaleForm } from "./SaleForm";

export default function NewSale() {
  return (
    <SharedLayout>
      <SaleForm mode="create" />
    </SharedLayout>
  );
}
