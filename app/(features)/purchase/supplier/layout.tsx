import PermissionGuard from "@/components/PermissionGuard";

export default function SupplierLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PermissionGuard permission="supplier:read">{children}</PermissionGuard>
  );
}
