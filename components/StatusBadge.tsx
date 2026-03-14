import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

/**
 * StatusBadge component handles uniform status styling across the app.
 */
export function StatusBadge({ 
  status, 
  className 
}: { 
  readonly status: string | null | undefined; 
  readonly className?: string; 
}) {
  if (!status) return null;

  const normalizedStatus = status.toUpperCase();

  const getVariant = (): "success" | "warning" | "destructive" | "info" | "neutral" | "default" | "secondary" => {
    switch (normalizedStatus) {
      // Success cases
      case "COMPLETED":
      case "PAID":
      case "ACTIVE":
      case "ACCEPTED":
      case "CONVERTED":
        return "success";
      
      // Warning cases
      case "PENDING":
      case "DRAFT":
      case "SENT":
      case "INITIAL":
      case "ADJUSTMENT":
        return "warning";

      // Info cases
      case "SALE":
      case "PURCHASE":
        return "info";

      // Destructive cases
      case "CANCELLED":
      case "OVERDUE":
      case "INACTIVE":
      case "REJECTED":
      case "DAMAGE":
        return "destructive";

      // Role cases
      case "SUPER_ADMIN":
        return "default";
      case "ADMIN":
      case "MANAGER":
        return "secondary";
      case "SELLER":
        return "neutral";

      default:
        return "neutral";
    }
  };

  const label = status.charAt(0) + status.slice(1).toLowerCase().replaceAll("_", " ");

  return (
    <Badge variant={getVariant()} className={cn("px-2.5 py-0.5", className)}>
      {label}
    </Badge>
  );
}
