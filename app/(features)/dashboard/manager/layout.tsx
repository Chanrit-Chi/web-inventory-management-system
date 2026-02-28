import PermissionGuard from "@/components/PermissionGuard";

export default function ManagerDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PermissionGuard permission="dashboard:manager">{children}</PermissionGuard>
  );
}
