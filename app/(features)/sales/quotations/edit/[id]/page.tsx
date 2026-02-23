"use client";

import { use } from "react";
import { QuotationForm } from "../../../new-quotation/QuotationForm";
import { SharedLayout } from "@/components/shared-layout";
import { useRouter } from "next/navigation";
import { useGetQuotationById } from "@/hooks/useQuotation";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

export default function EditQuotationPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: quotation, isLoading } = useGetQuotationById(id);

  const handleSuccess = () => {
    router.push("/sales/quotations");
  };

  if (isLoading) {
    return (
      <SharedLayout>
        <div className="flex h-96 items-center justify-center">
          <Spinner className="size-8" />
        </div>
      </SharedLayout>
    );
  }

  if (!quotation) {
    return (
      <SharedLayout>
        <div className="p-4 md:p-6 text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">
            Quotation not found
          </h1>
          <Button onClick={() => router.push("/sales/quotations")}>
            Back to Quotations
          </Button>
        </div>
      </SharedLayout>
    );
  }

  if (quotation.status === "CONVERTED") {
    return (
      <SharedLayout>
        <div className="p-4 md:p-6 text-center">
          <h1 className="text-2xl font-bold text-yellow-500 mb-4">
            Cannot Edit Converted Quotation
          </h1>
          <p className="text-muted-foreground mb-4">
            This quotation has already been converted to a sale and cannot be
            edited.
          </p>
          <Button onClick={() => router.push("/sales/quotations")}>
            Back to Quotations
          </Button>
        </div>
      </SharedLayout>
    );
  }

  return (
    <SharedLayout>
      <div className="p-4 md:p-6">
        <QuotationForm
          mode="edit"
          quotation={quotation}
          quotationId={id}
          onSuccess={handleSuccess}
        />
      </div>
    </SharedLayout>
  );
}
