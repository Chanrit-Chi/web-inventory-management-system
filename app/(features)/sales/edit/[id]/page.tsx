"use client";

import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { SharedLayout } from "@/components/shared-layout";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { useGetSaleById } from "@/hooks/useSale";

import {
  SaleForm,
  type SaleWithDetailsResponse,
} from "../../new-sale/SaleForm";

export default function EditSalePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const paramValue = params?.id;
  const rawId = Array.isArray(paramValue) ? paramValue[0] : paramValue;

  const saleId = Number(rawId);
  const isValidId = Number.isInteger(saleId) && saleId > 0;
  const {
    data: sale,
    isLoading,
    error,
  } = useGetSaleById(isValidId ? saleId : 0);

  if (!isValidId) {
    return (
      <SharedLayout>
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
          <h2 className="text-xl font-bold text-red-600">
            Invalid sale identifier provided.
          </h2>
          <Button
            variant="outline"
            onClick={() => router.push("/sales/all-sale")}
          >
            Back to Sales
          </Button>
        </div>
      </SharedLayout>
    );
  }

  if (isLoading) {
    return (
      <SharedLayout>
        <div className="flex h-100 w-full items-center justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      </SharedLayout>
    );
  }

  if (error || !sale) {
    return (
      <SharedLayout>
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
          <h2 className="text-xl font-bold text-red-600">
            Error: {error?.message || "Sale not found"}
          </h2>
          <Button
            variant="outline"
            onClick={() => router.push("/sales/all-sale")}
          >
            Back to Sales
          </Button>
        </div>
      </SharedLayout>
    );
  }

  return (
    <SharedLayout>
      <div className="w-full px-4 md:px-6 py-6">
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/sales/all-sale")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Edit Sale</h1>
        </div>

        <SaleForm
          mode="edit"
          sale={sale as SaleWithDetailsResponse}
          saleId={saleId}
          onSuccess={() => router.push("/sales/all-sale")}
        />
      </div>
    </SharedLayout>
  );
}
