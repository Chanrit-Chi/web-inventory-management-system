import PermissionGuard from "@/components/PermissionGuard";

export default function EditProductLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PermissionGuard permission="product:update">{children}</PermissionGuard>
  );
}
