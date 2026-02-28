import PermissionGuard from "@/components/PermissionGuard";

export default function AllCategoriesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PermissionGuard permission="category:read">{children}</PermissionGuard>
  );
}
