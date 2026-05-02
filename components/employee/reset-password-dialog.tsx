"use client";

import { useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Copy, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { User } from "@/schemas/type-export.schema";
import { BaseDialog } from "@/components/dialog-template";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { copyToClipboard } from "@/lib/password-generator";

export function ResetPasswordDialog({
  user,
  open,
  onOpenChange,
}: {
  readonly user: User;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const [newPassword, setNewPassword] = useState<string>("");
  const [isResetting, setIsResetting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const response = await fetch(`/api/users/${user.id}/reset-password`, {
        method: "PATCH",
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Failed to reset password" }));
        throw new Error(errorData.error || "Failed to reset password");
      }

      const data = await response.json();
      setNewPassword(data.password);
      toast.success("Password reset successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to reset password";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setIsResetting(false);
    }
  };

  const handleCopyPassword = async () => {
    if (newPassword) {
      const success = await copyToClipboard(newPassword);
      if (success) {
        toast.success("Password copied to clipboard");
      } else {
        toast.error("Failed to copy password");
      }
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setNewPassword("");
      setShowPassword(false);
    }
    onOpenChange(open);
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={handleClose}
      title="Reset Password"
      description="Generate a new password for this user"
      className="sm:max-w-112.5"
    >
      <div className="space-y-4 py-4">
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-semibold">User Name:</p>
          <p className="text-sm">{user.name}</p>
          <p className="text-sm font-semibold mt-2">Email:</p>
          <p className="text-sm">{user.email}</p>
        </div>

        {!newPassword ? (
          <div className="pt-2">
            <Button
              onClick={handleReset}
              className="w-full"
              disabled={isResetting}
            >
              {isResetting ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Generate New Password
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    readOnly
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyPassword}
                  title="Copy password"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Make sure to copy and share this password with the user. This is
                the only time you&apos;ll be able to see it.
              </AlertDescription>
            </Alert>

            <div className="pt-2">
              <Button
                onClick={() => handleClose(false)}
                className="w-full"
                variant="default"
              >
                Done
              </Button>
            </div>
          </>
        )}
      </div>
    </BaseDialog>
  );
}
