import PermissionGuard from "@/components/PermissionGuard";

export default function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PermissionGuard permission="customer:read">{children}</PermissionGuard>
  );
}
