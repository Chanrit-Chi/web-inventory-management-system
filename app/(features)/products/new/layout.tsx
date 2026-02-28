import PermissionGuard from "@/components/PermissionGuard";

export default function NewProductLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PermissionGuard permission="product:create">{children}</PermissionGuard>
  );
}
