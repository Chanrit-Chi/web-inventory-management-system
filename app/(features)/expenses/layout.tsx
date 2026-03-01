import PermissionGuard from "@/components/PermissionGuard";

export default function ExpensesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PermissionGuard permission="expense:read">{children}</PermissionGuard>
  );
}
