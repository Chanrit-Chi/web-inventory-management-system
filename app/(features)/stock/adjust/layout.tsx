import PermissionGuard from "@/components/PermissionGuard";

export default function StockAdjustLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PermissionGuard permission="stock:update">{children}</PermissionGuard>
  );
}
