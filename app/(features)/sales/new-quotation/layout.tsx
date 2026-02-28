import PermissionGuard from "@/components/PermissionGuard";

export default function NewQuotationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PermissionGuard permission="quotation:create">{children}</PermissionGuard>
  );
}
