import PermissionGuard from "@/components/PermissionGuard";

export default function ProductListLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PermissionGuard permission="product:read">{children}</PermissionGuard>
  );
}
