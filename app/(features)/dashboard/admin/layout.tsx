import PermissionGuard from "@/components/PermissionGuard";

export default function AdminDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PermissionGuard permission="dashboard:admin">{children}</PermissionGuard>
  );
}
