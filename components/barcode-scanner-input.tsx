import { useState, useRef, useEffect } from "react";
import { Barcode, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePermission } from "@/hooks/usePermission";
import { usePhysicalBarcodeScanner } from "@/hooks/usePhysicalBarcodeScanner";
import { toast } from "sonner";

interface BarcodeScannerInputProps {
  onScan: (code: string) => Promise<void>;
  className?: string;
  placeholder?: string;
}

export function BarcodeScannerInput({
  onScan,
  className = "w-full pl-9 pr-9 bg-muted/30 focus-visible:ring-1 cursor-default",
  placeholder = "Ready to scan...",
}: BarcodeScannerInputProps) {
  const [isScanning, setIsScanning] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement | null>(null);
  const didAutoFocusRef = useRef(false);
  const isProcessingRef = useRef(false);

  const { can, isPending: permissionPending } = usePermission();
  const canUseScanner = !permissionPending && can("barcode:read");

  useEffect(() => {
    if (!canUseScanner || didAutoFocusRef.current) return;
    barcodeInputRef.current?.focus();
    didAutoFocusRef.current = true;
  }, [canUseScanner]);

  const handleScan = async (code: string) => {
    if (!canUseScanner) {
      toast.error("You do not have permission to use barcode scanner");
      return;
    }
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    setIsScanning(true);
    try {
      await onScan(code);
      if (barcodeInputRef.current) barcodeInputRef.current.value = "";
      barcodeInputRef.current?.focus();
    } catch (error) {
       console.error("Barcode scan processing error:", error);
    } finally {
      setIsScanning(false);
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 300);
    }
  };

  usePhysicalBarcodeScanner({
    onScan: handleScan,
    enabled: canUseScanner,
    inputRef: barcodeInputRef,
    keepFocus: true,
  });

  if (permissionPending || !canUseScanner) {
    return !permissionPending ? (
      <p className="mb-4 text-xs text-muted-foreground w-full">
        You don&apos;t have permission (`barcode:read`) to use scanner controls.
      </p>
    ) : null;
  }

  return (
    <div className="relative w-full sm:w-64">
      <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        ref={barcodeInputRef}
        type="text"
        defaultValue=""
        readOnly
        placeholder={placeholder}
        className={className}
        title="Barcode scanner input (auto-detect)"
      />
      {isScanning && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
