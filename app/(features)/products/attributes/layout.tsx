import PermissionGuard from "@/components/PermissionGuard";

export default function AttributeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PermissionGuard permission="attribute:read">{children}</PermissionGuard>
  );
}
