"use client";

import { use } from "react";
import { SharedLayout } from "@/components/shared-layout";
import { useRouter } from "next/navigation";
import { useGetQuotationById } from "@/hooks/useQuotation";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Calendar,
  User,
  Package,
  DollarSign,
  ArrowLeft,
  Edit,
  Printer,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ViewQuotationPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: quotation, isLoading } = useGetQuotationById(id);

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

  const getStatusVariant = (status: string) => {
    const variants: Record<
      string,
      "secondary" | "info" | "success" | "destructive" | "warning" | "default"
    > = {
      DRAFT: "secondary",
      SENT: "info",
      ACCEPTED: "success",
      REJECTED: "destructive",
      EXPIRED: "warning",
      CONVERTED: "default",
    };
    return variants[status] || "default";
  };

  return (
    <SharedLayout>
      <div className="p-4 md:p-6">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/sales/quotations")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-500" />
                Quotation {quotation.quotationNumber}
              </h1>
              <p className="text-muted-foreground text-sm">
                ID: #{quotation.id}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => globalThis.print()}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            <Button
              onClick={() =>
                router.push(`/sales/quotations/edit/${quotation.id}`)
              }
            >
              <Edit className="mr-2 h-4 w-4" /> Edit Quotation
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" /> Order Items
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-y">
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">
                          Product
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-slate-600">
                          Price
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-slate-600">
                          Qty
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-slate-600">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {quotation.quotationItems.map((item, index) => (
                        <tr
                          key={item.id || index}
                          className="hover:bg-slate-50/50"
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium">
                              {item.productName}
                            </div>
                            {item.variantId && (
                              <div className="text-xs text-muted-foreground">
                                Variant ID: {item.variantId}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            ${Number(item.unitPrice).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            ${Number(item.lineTotal).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Additional Info / Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" /> Quotation Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Created Date</span>
                    <span className="font-medium">
                      {format(new Date(quotation.createdAt), "PPP p")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Last Updated</span>
                    <span className="font-medium">
                      {format(new Date(quotation.updatedAt), "PPP p")}
                    </span>
                  </div>
                  {quotation.status === "CONVERTED" && (
                    <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-100 text-sm">
                      This quotation has been converted to a sale.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Badge
                  className="w-fit text-sm py-1 px-3"
                  variant={getStatusVariant(quotation.status)}
                >
                  {quotation.status}
                </Badge>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar className="h-4 w-4" />
                  Valid Until:{" "}
                  <span className="text-slate-900 font-medium">
                    {format(new Date(quotation.validUntil), "PPP")}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Customer Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" /> Customer Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Customer Name</p>
                  <p className="font-semibold text-lg">
                    {quotation.customer?.name || "N/A"}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-slate-500 mb-1">Email</p>
                  <p className="text-sm">
                    {quotation.customer?.email || "No email provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Phone</p>
                  <p className="text-sm">
                    {quotation.customer?.phone || "No phone provided"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card className="bg-slate-900 text-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-400" /> Financial
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Subtotal</span>
                  <span>${Number(quotation.subtotal).toFixed(2)}</span>
                </div>
                {Number(quotation.discountAmount) > 0 && (
                  <div className="flex justify-between text-sm text-emerald-400">
                    <span>Discount ({quotation.discountPercent}%)</span>
                    <span>-${Number(quotation.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                {Number(quotation.taxAmount) > 0 && (
                  <div className="flex justify-between text-sm text-amber-400">
                    <span>Tax ({quotation.taxPercent}%)</span>
                    <span>+${Number(quotation.taxAmount).toFixed(2)}</span>
                  </div>
                )}
                <Separator className="bg-slate-700" />
                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-2xl text-blue-400">
                    ${Number(quotation.totalAmount).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SharedLayout>
  );
}
