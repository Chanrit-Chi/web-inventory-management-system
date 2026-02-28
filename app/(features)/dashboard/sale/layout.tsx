import PermissionGuard from "@/components/PermissionGuard";

export default function SaleDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PermissionGuard permission="dashboard:sale">{children}</PermissionGuard>
  );
}
