import PermissionGuard from "@/components/PermissionGuard";

export default function EditSaleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PermissionGuard permission="sale:update">{children}</PermissionGuard>;
}
