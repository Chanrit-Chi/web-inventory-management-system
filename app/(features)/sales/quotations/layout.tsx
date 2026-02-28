import PermissionGuard from "@/components/PermissionGuard";

export default function QuotationsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PermissionGuard permission="quotation:read">{children}</PermissionGuard>
  );
}
