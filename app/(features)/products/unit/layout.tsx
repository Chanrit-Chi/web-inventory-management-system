import PermissionGuard from "@/components/PermissionGuard";

export default function UnitLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PermissionGuard permission="unit:read">{children}</PermissionGuard>;
}
