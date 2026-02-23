"use client";

import { QuotationForm } from "./QuotationForm";
import { SharedLayout } from "@/components/shared-layout";
import { useRouter } from "next/navigation";

export default function NewQuotationPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/sales/quotations");
  };

  return (
    <SharedLayout>
      <div className="p-4 md:p-6">
        <QuotationForm mode="create" onSuccess={handleSuccess} />
      </div>
    </SharedLayout>
  );
}
