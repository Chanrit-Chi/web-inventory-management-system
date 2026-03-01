"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PermissionGroupEditor } from "@/components/admin/permission-group-editor";
import ClientPermissionGuard from "@/components/ClientPermissionGuard";
import { ArrowLeft } from "lucide-react";

export default function EditPermissionGroupPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  return (
    <ClientPermissionGuard permission="permission:admin">
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/settings/permissions")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Permissions
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            Edit Permission Group
          </h1>
          <p className="text-muted-foreground mt-2">
            Modify the group permissions and settings
          </p>
        </div>

        <PermissionGroupEditor
          groupId={groupId}
          onSaved={() => router.push("/settings/permissions")}
          onCancel={() => router.push("/settings/permissions")}
        />
      </div>
    </ClientPermissionGuard>
  );
}
