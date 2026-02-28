import PermissionGuard from "@/components/PermissionGuard";

export default function EditPurchaseOrderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PermissionGuard permission="purchase_order:update">
      {children}
    </PermissionGuard>
  );
}
