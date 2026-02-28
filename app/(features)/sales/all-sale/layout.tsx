import PermissionGuard from "@/components/PermissionGuard";

export default function AllSaleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PermissionGuard permission="sale:read">{children}</PermissionGuard>;
}
