"use client";

import { useState, forwardRef, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  FileText,
} from "lucide-react";
import { useQuotationMutations } from "@/hooks/useQuotation";
import { useGetPaymentMethods } from "@/hooks/usePaymentMethod";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { QuotationWithItems } from "@/schemas/type-export.schema";
import { useReactToPrint } from "react-to-print";
import { format } from "date-fns";
import { DocumentLayout } from "@/app/(features)/sales/components/documents/DocumentLayout";
import { DocumentTable } from "@/app/(features)/sales/components/documents/DocumentTable";

type Quotation = QuotationWithItems;

function StatusBadge({ status }: { readonly status: string }) {
  const styles = {
    DRAFT: "bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-600/50",
    SENT: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700/50",
    ACCEPTED: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700/50",
    REJECTED: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700/50",
    EXPIRED: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700/50",
    CONVERTED: "bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-600/50",
  };

  const icons = {
    DRAFT: FileText,
    SENT: Clock,
    ACCEPTED: CheckCircle2,
    REJECTED: XCircle,
    EXPIRED: Clock,
    CONVERTED: CheckCircle2,
  };

  const style =
    styles[status as keyof typeof styles] ||
    "bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-600/50";
  const Icon = icons[status as keyof typeof styles] || Info;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {status}
    </span>
  );
}

interface ConvertQuotationDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly quotationId: string;
  readonly quotationNumber: string;
}

export function ConvertQuotationDialog({
  open,
  onOpenChange,
  quotationId,
  quotationNumber,
}: ConvertQuotationDialogProps) {
  const { convertToSale } = useQuotationMutations();
  const { data: paymentMethods, isLoading: isLoadingPM } =
    useGetPaymentMethods();
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");

  const handleConvert = () => {
    if (!paymentMethodId) {
      toast.error("Please select a payment method");
      return;
    }

    const toastId = toast.loading("Converting quotation to sale...");
    convertToSale.mutate(
      {
        id: quotationId,
        paymentMethodId: Number(paymentMethodId),
      },
      {
        onSuccess: () => {
          toast.success("Quotation converted to sale successfully!", {
            id: toastId,
          });
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(`Failed to convert: ${err.message}`, { id: toastId });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convert Quotation to Sale</DialogTitle>
          <DialogDescription>
            This will create a new sale order from Quotation #{quotationNumber}.
            Please select the payment method to proceed.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingPM ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : (
                  paymentMethods?.map((pm) => (
                    <SelectItem key={pm.id} value={String(pm.id)}>
                      {pm.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConvert}
            disabled={convertToSale.isPending || !paymentMethodId}
          >
            {convertToSale.isPending && <Spinner className="mr-2 h-4 w-4" />}
            Confirm Conversion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
const QuotationContent = forwardRef<
  HTMLDivElement,
  { quotation: Quotation}
>(({ quotation}, ref) => {
  return (
    <div ref={ref}>
      <DocumentLayout
        title="Quotation"
        documentNumber={quotation.quotationNumber}
        date={format(new Date(quotation.issueDate), "PPP")}
        dueDate={format(new Date(quotation.validUntil), "PPP")}
        statusBadge={<StatusBadge status={quotation.status} />}
        customer={{
          name: quotation.customer?.name || "N/A",
          email: quotation.customer?.email,
          phone: quotation.customer?.phone,
        }}
        subtotal={Number(quotation.subtotal)}
        discountPercent={quotation.discountPercent}
        discountAmount={Number(quotation.discountAmount)}
        taxPercent={quotation.taxPercent}
        taxAmount={Number(quotation.taxAmount)}
        totalAmount={Number(quotation.totalAmount)}
        notes={quotation.notes}
        terms={quotation.terms}
      >
        <DocumentTable
          items={quotation.quotationItems.map((item) => ({
            description: item.productName || "Unknown Product",
            sku: item.sku,
            price: Number(item.unitPrice),
            quantity: item.quantity,
            total: Number(item.lineTotal),
          }))}
        />
      </DocumentLayout>
    </div>
  );
});
QuotationContent.displayName = "QuotationContent";

export function ViewQuotationDialog({
  quotation,
  open,
  onOpenChange,
  autoPrint = false,
}: {
  readonly quotation: Quotation | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly autoPrint?: boolean;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Quotation ${quotation?.quotationNumber}`,
    onBeforePrint: async () => setIsPrinting(true),
    onAfterPrint: () => {
      setIsPrinting(false);
      if (autoPrint) {
        onOpenChange(false);
      }
    },
  });

  useEffect(() => {
    if (open && autoPrint && quotation) {
      const checkRef = setInterval(() => {
        if (contentRef.current) {
          clearInterval(checkRef);
          handlePrint();
        }
      }, 100);

      return () => clearInterval(checkRef);
    }
  }, [open, autoPrint, quotation, handlePrint]);

  if (!quotation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 block focus:outline-none"
        showCloseButton={false}
      >
        <div className="relative rounded-lg w-full">
          <div
            className={autoPrint && isPrinting ? "opacity-0" : "opacity-100"}
          >
            <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b py-4 px-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold">
                  Quotation {quotation.quotationNumber}
                </h2>
                
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handlePrint()}
                  variant="default"
                  size="sm"
                  disabled={isPrinting}
                  className="flex items-center gap-2"
                >
                  {isPrinting ? (
                    <span className="animate-spin mr-2">⏳</span>
                  ) : (
                    <Printer className="h-4 w-4" />
                  )}
                  Print
                </Button>
                <Button
                  variant="outline"
                  className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onClick={() => onOpenChange(false)}
                >
                  <XCircle className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
          <div
            className={autoPrint && isPrinting ? "opacity-0" : "opacity-100"}
          >
            <QuotationContent
              ref={contentRef}
              quotation={quotation}
              
            />
          </div>
        </div>
        {autoPrint && isPrinting && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-20">
            <div className="text-center">
              <Printer className="h-12 w-12 text-blue-500 animate-bounce mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground">
                Preparing Print Job...
              </p>
              <p className="text-sm text-muted-foreground">
                The print dialog will open automatically.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
