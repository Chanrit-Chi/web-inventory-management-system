import PermissionGuard from "@/components/PermissionGuard";

export default function NewPurchaseOrderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PermissionGuard permission="purchase_order:create">
      {children}
    </PermissionGuard>
  );
}
