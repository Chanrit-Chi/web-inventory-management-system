import PermissionGuard from "@/components/PermissionGuard";

export default function PurchaseOrderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PermissionGuard permission="purchase_order:read">
      {children}
    </PermissionGuard>
  );
}
