import PermissionGuard from "@/components/PermissionGuard";

export default function EmployeeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PermissionGuard permission="user:read">{children}</PermissionGuard>;
}
