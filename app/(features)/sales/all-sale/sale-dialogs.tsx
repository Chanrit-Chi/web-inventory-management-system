import {
  Package,
  Calendar,
  Info,
  DollarSign,
  User,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  FileText,
} from "lucide-react";

import { ConfirmDialog, ViewDialog } from "@/components/dialog-template";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { OrderWithRelations } from "@/schemas/type-export.schema";
import { Button } from "@/components/ui/button";
import { forwardRef, useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import { DocumentLayout } from "@/app/(features)/sales/components/documents/DocumentLayout";
import { DocumentTable } from "@/app/(features)/sales/components/documents/DocumentTable";

// Use Zod-inferred type
type Sale = OrderWithRelations;

/**
 * Standard info field with icon
 */
function SaleField({
  icon: Icon,
  label,
  value,
  className = "text-foreground",
}: {
  readonly icon: React.ElementType;
  readonly label?: string;
  readonly value: React.ReactNode;
  readonly className?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        {label && (
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
        )}
        <div className={`text-sm ${className}`}>{value}</div>
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  className = "mb-4 mt-0",
}: {
  readonly icon: React.ElementType;
  readonly title: string;
  readonly className?: string;
}) {
  return (
    <div className={className}>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4" />
        {title}
      </h3>
      <div className="h-px bg-linear-to-r from-border via-border/50 to-transparent mb-3" />
    </div>
  );
}

function StatusBadge({ status }: { readonly status: string }) {
  const styles = {
    COMPLETED:
      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700/50",
    PENDING:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700/50",
    CANCELLED:
      "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700/50",
    DRAFT:
      "bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-600/50",
    PAID: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700/50",
    OVERDUE:
      "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700/50",
    SENT: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700/50",
  };

  const icons = {
    COMPLETED: CheckCircle2,
    PENDING: Clock,
    CANCELLED: XCircle,
    DRAFT: FileText,
    PAID: CheckCircle2,
    OVERDUE: Clock,
    SENT: Clock,
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

const VIEW_SALE_FIELDS = [
  // Header section with ID and Status
  {
    label: "",
    value: (sale: Sale) => (
      <div className="flex items-center justify-between mb-6 bg-muted/30 p-4 rounded-lg border border-border">
        <div>
          <p className="text-sm text-muted-foreground font-medium">Sale ID</p>
          <p className="text-xl font-bold font-mono text-foreground">
            #{sale.id}
          </p>
        </div>
        <div>
          <StatusBadge status={sale.status} />
        </div>
      </div>
    ),
  },

  // Customer & Payment Info
  {
    label: "",
    value: () => <SectionHeader icon={User} title="Customer & Payment" />,
  },
  {
    label: "Customer",
    value: (sale: Sale) => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SaleField
          icon={User}
          label="Name"
          value={sale.customer?.name || "N/A"}
          className="font-medium"
        />
        <SaleField
          icon={Info}
          label="Contact"
          value={
            <div className="space-y-0.5">
              <p>{sale.customer?.email || "No email"}</p>
              <p className="text-muted-foreground">
                {sale.customer?.phone || "No phone"}
              </p>
            </div>
          }
        />
      </div>
    ),
  },
  {
    label: "Payment Method",
    value: (sale: Sale) => (
      <div className="mt-4">
        <SaleField
          icon={CreditCard}
          label="Method"
          value={sale.paymentMethod?.name || "N/A"}
        />
      </div>
    ),
  },

  // Order Items
  {
    label: "",
    value: () => (
      <SectionHeader icon={Package} title="Order Items" className="mb-4 mt-6" />
    ),
  },
  {
    label: "",
    value: (sale: Sale) => (
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                Product
              </th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                Price
              </th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                Qty
              </th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sale.orderDetail?.map((detail, index) => (
              <tr key={detail.id || index} className="hover:bg-muted/20">
                <td className="px-4 py-2">
                  <div className="font-medium">
                    {detail.product?.name || "Unknown Product"}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {detail.variant?.sku}
                  </div>
                </td>
                <td className="px-4 py-2 text-right">
                  ${Number(detail.unitPrice).toFixed(2)}
                </td>
                <td className="px-4 py-2 text-right">{detail.quantity}</td>
                <td className="px-4 py-2 text-right font-medium">
                  ${(Number(detail.unitPrice) * detail.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
            {(!sale.orderDetail || sale.orderDetail.length === 0) && (
              <tr key="empty-order-detail">
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No items in this order
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    ),
  },

  // Financial Summary
  {
    label: "",
    value: () => (
      <SectionHeader
        icon={DollarSign}
        title="Financial Summary"
        className="mb-4 mt-6"
      />
    ),
  },
  {
    label: "",
    value: (sale: Sale) => (
      <div className="bg-muted/30 rounded-lg p-4 space-y-2 border border-border">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">
            $
            {(
              sale.orderDetail?.reduce(
                (sum, item) => sum + Number(item.unitPrice) * item.quantity,
                0,
              ) || 0
            ).toFixed(2)}
          </span>
        </div>
        {Number(sale.discountAmount) > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount ({sale.discountPercent}%)</span>
            <span>-${Number(sale.discountAmount).toFixed(2)}</span>
          </div>
        )}
        {Number(sale.taxAmount) > 0 && (
          <div className="flex justify-between text-sm text-amber-600">
            <span>Tax ({sale.taxPercent}%)</span>
            <span>+${Number(sale.taxAmount).toFixed(2)}</span>
          </div>
        )}
        <div className="border-t border-border my-2 pt-2 flex justify-between items-center">
          <span className="font-bold text-foreground">Total Amount</span>
          <span className="font-bold text-lg text-foreground">
            ${Number(sale.totalPrice).toFixed(2)}
          </span>
        </div>
      </div>
    ),
  },

  // Timestamps
  {
    label: "",
    value: () => (
      <SectionHeader icon={Clock} title="Timeline" className="mb-4 mt-6" />
    ),
  },
  {
    label: "",
    value: (sale: Sale) => (
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground mb-1">Created At</p>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(sale.createdAt).toLocaleString()}</span>
          </div>
        </div>
        <div>
          <p className="text-muted-foreground mb-1">Last Updated</p>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(sale.updatedAt).toLocaleString()}</span>
          </div>
        </div>
      </div>
    ),
  },
];

// View Sale Dialog
export function ViewSaleDialog({
  sale,
  open,
  onOpenChange,
}: {
  readonly sale: Sale;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  return (
    <ViewDialog<Sale>
      open={open}
      onOpenChange={onOpenChange}
      title="Sale Details"
      description="Sale Information"
      item={sale}
      className="sm:max-w-2xl"
      fields={VIEW_SALE_FIELDS}
    />
  );
}

const InvoiceContent = forwardRef<HTMLDivElement, { sale: Sale }>(
  ({ sale }, ref) => {
    return (
      <div ref={ref}>
        <DocumentLayout
          title="Invoice"
          documentNumber={sale.invoice?.invoiceNumber ?? `INV-${sale.id}`}
          date={new Date(sale.createdAt).toLocaleDateString()}
          statusBadge={
            <StatusBadge status={sale.invoice?.status ?? sale.status} />
          }
          customer={{
            name: sale.customer?.name || "N/A",
            email: sale.customer?.email,
            phone: sale.customer?.phone,
          }}
          paymentMethod={sale.paymentMethod?.name}
          subtotal={
            Number(sale.totalPrice) +
            Number(sale.discountAmount) -
            Number(sale.taxAmount)
          }
          discountPercent={sale.discountPercent}
          discountAmount={Number(sale.discountAmount)}
          taxPercent={sale.taxPercent}
          taxAmount={Number(sale.taxAmount)}
          totalAmount={Number(sale.totalPrice)}
          notes={sale.invoice?.notes}
          terms={sale.invoice?.terms}
        >
          <DocumentTable
            items={
              sale.orderDetail?.map((detail) => ({
                id: detail.id,
                description: detail.product?.name || "Unknown Product",
                sku: detail.variant?.sku,
                price: Number(detail.unitPrice),
                quantity: detail.quantity,
                total: Number(detail.unitPrice) * detail.quantity,
              })) || []
            }
          />
        </DocumentLayout>
      </div>
    );
  },
);

InvoiceContent.displayName = "InvoiceContent";

export function InvoiceDialog({
  sale,
  open,
  onOpenChange,
  autoPrint = false,
}: {
  readonly sale: Sale;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly autoPrint?: boolean;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Invoice # ${sale.invoice?.invoiceNumber ?? sale.id}`,
    onBeforePrint: async () => {
      setIsPrinting(true);
    },
    onAfterPrint: () => {
      setIsPrinting(false);
      if (autoPrint) {
        onOpenChange(false);
      }
    },
    onPrintError: (error) => {
      setIsPrinting(false);
      console.error("Print Error:", error);
      toast.error("Failed to open print dialog");
    },
  });

  useEffect(() => {
    if (open && autoPrint) {
      const checkRef = setInterval(() => {
        if (contentRef.current) {
          clearInterval(checkRef);
          handlePrint();
        }
      }, 100);

      return () => clearInterval(checkRef);
    }
  }, [open, autoPrint, handlePrint]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 block focus:outline-none"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle></DialogTitle>
        </DialogHeader>
        <div className="relative rounded-lg w-full">
          {/* Header with Close and Print buttons */}
          <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b py-4 px-6 z-10">
            <div
              className={`flex items-center justify-between gap-4 ${
                autoPrint && isPrinting ? "opacity-0" : "opacity-100"
              }`}
            >
              <h2 className="text-xl font-semibold">
                Invoice #{sale.invoice?.invoiceNumber ?? sale.id}
              </h2>
              <div className="flex items-center gap-2">
                {/* Print button */}
                <Button
                  onClick={() => handlePrint()}
                  variant="default"
                  size="sm"
                  disabled={isPrinting}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {isPrinting ? (
                    <span className="animate-spin mr-2">⏳</span>
                  ) : (
                    <Printer className="h-4 w-4" />
                  )}
                  {isPrinting ? "Opening..." : "Print"}
                </Button>
                {/* Close button */}
                <Button
                  variant="default"
                  onClick={() => onOpenChange(false)}
                  className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <XCircle className="h-3 w-3" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Invoice content */}
          <div
            className={autoPrint && isPrinting ? "opacity-0" : "opacity-100"}
          >
            <InvoiceContent ref={contentRef} sale={sale} />
          </div>

          {autoPrint && isPrinting && (
            <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-20">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
// Complete Sale Confirmation Dialog
export function CompleteSaleDialog({
  sale,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: {
  readonly sale: Sale;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: () => void;
  readonly isLoading: boolean;
}) {
  return (
    <ConfirmDialog<Sale>
      open={open}
      onOpenChange={onOpenChange}
      title="Complete Sale"
      description="Are you sure you want to mark this sale as completed?"
      item={sale}
      confirmLabel="Mark as Completed"
      confirmVariant="default"
      isLoading={isLoading}
      onConfirm={async () => {
        onConfirm();
      }}
      renderItem={(sale: Sale) => (
        <div className="space-y-4">
          <div className="p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">
                Invoice Number
              </span>
              <span className="font-mono font-bold">
                {sale.invoice?.invoiceNumber}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Total Amount
              </span>
              <span className="font-bold text-foreground">
                ${Number(sale.totalPrice).toFixed(2)}
              </span>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 text-sm">
            <Info className="h-5 w-5 shrink-0 mt-0.5" />
            <p>
              By marking this sale as completed, the inventory will be deducted
              and the transaction will be finalized. This action cannot be
              undone easily.
            </p>
          </div>
        </div>
      )}
    />
  );
}
