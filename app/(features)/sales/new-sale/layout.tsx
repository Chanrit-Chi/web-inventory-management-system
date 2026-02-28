import PermissionGuard from "@/components/PermissionGuard";

export default function NewSaleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PermissionGuard permission="sale:create">{children}</PermissionGuard>;
}
