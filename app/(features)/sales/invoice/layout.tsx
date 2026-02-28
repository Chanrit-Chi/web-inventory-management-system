import PermissionGuard from "@/components/PermissionGuard";

export default function InvoiceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PermissionGuard permission="invoice:read">{children}</PermissionGuard>
  );
}
