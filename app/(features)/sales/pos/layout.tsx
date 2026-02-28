import PermissionGuard from "@/components/PermissionGuard";

export default function PosLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PermissionGuard permission="pos:read">{children}</PermissionGuard>;
}
