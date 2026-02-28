import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { User, UserCreate, UserUpdate } from "@/schemas/type-export.schema";
import {
  BaseDialog,
  ConfirmDialog,
  ViewDialog,
} from "@/components/dialog-template";
import { useUserMutations, useGetUserById, useGetUsers } from "@/hooks/useUser";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Role } from "@prisma/client";
import {
  Plus,
  AlertTriangle,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generatePassword, copyToClipboard } from "@/lib/password-generator";
import { useState } from "react";

// Create User Dialog
export function CreateUserDialog({
  open,
  onOpenChange,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const { addUser } = useUserMutations();
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUserRole = (session?.user as any)?.role as Role | undefined;
  const isSuperAdmin = currentUserRole === Role.SUPER_ADMIN;
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<UserCreate>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: Role.SELLER,
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
      setGeneratedPassword("");
      setPasswordValue("");
      setShowPassword(false);
    }
    onOpenChange(newOpen);
  };

  const handleGeneratePassword = () => {
    const newPassword = generatePassword(12);
    setGeneratedPassword(newPassword);
    setPasswordValue(newPassword);
    setValue("password", newPassword);
    setShowPassword(true);
    toast.info("Password generated");
  };

  const handleCopyPassword = async () => {
    if (passwordValue && (await copyToClipboard(passwordValue))) {
      toast.success("Password copied to clipboard");
    } else {
      toast.error("Failed to copy password");
    }
  };

  const onAddUser = async (data: UserCreate) => {
    try {
      await addUser.mutateAsync(data);
      toast.success("User created successfully");

      if (generatedPassword) {
        toast.info("Make sure to share the password with the user", {
          duration: 5000,
        });
      }

      onOpenChange(false);
      reset();
      setGeneratedPassword("");
      setPasswordValue("");
      setShowPassword(false);
    } catch (error) {
      toast.error("Failed to create user");
      console.error(error);
    }
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Add User"
      description="Create a new employee account"
      className="sm:max-w-112.5"
    >
      <form onSubmit={handleSubmit(onAddUser)} className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            placeholder="John Doe"
            {...register("name", { required: "Name is required" })}
          />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            {...register("email", { required: "Email is required" })}
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">
            Password <span className="text-red-500">*</span>
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters",
                  },
                  onChange: (e) => setPasswordValue(e.target.value),
                })}
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
              onClick={handleGeneratePassword}
              title="Generate password"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyPassword}
              title="Copy password"
              disabled={!passwordValue}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
          {generatedPassword && (
            <Alert className="mt-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Make sure to copy and share this password with the user. They
                will need it to login.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">
            Role <span className="text-red-500">*</span>
          </Label>
          <Select
            onValueChange={(value) => setValue("role", value as Role)}
            defaultValue={Role.SELLER}
          >
            <SelectTrigger id="role">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={Role.SELLER}>Seller</SelectItem>
              <SelectItem value={Role.MANAGER}>Manager</SelectItem>
              <SelectItem value={Role.ADMIN}>Admin</SelectItem>
              {isSuperAdmin && (
                <SelectItem value={Role.SUPER_ADMIN}>Super Admin</SelectItem>
              )}
            </SelectContent>
          </Select>
          {errors.role && (
            <p className="text-xs text-red-500">{errors.role.message}</p>
          )}
        </div>

        <div className="pt-2">
          <Button type="submit" className="w-full" disabled={addUser.isPending}>
            {addUser.isPending ? (
              <Spinner className="mr-2 h-4 w-4" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Create User
          </Button>
        </div>
      </form>
    </BaseDialog>
  );
}

// View User Dialog
export function ViewUserDialog({
  user,
  open,
  onOpenChange,
}: {
  readonly user: User;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const { data: allUsers } = useGetUsers();

  const getUserName = (userId: string | null | undefined) => {
    if (!userId) return "N/A";
    const foundUser = allUsers?.find((u) => u.id === userId);
    return foundUser ? foundUser.name : userId.substring(0, 8);
  };

  return (
    <ViewDialog<User>
      open={open}
      onOpenChange={onOpenChange}
      title="View User"
      description="User details and information"
      item={user}
      fields={[
        {
          label: "Name",
          value: (u) => u.name,
        },
        {
          label: "Email",
          value: (u) => u.email,
        },
        {
          label: "Role",
          value: (u) => u.role,
        },
        {
          label: "Email Verified",
          value: (u) => (u.emailVerified ? "Yes" : "No"),
        },
        {
          label: "Status",
          value: (u) => (u.isActive ? "Active" : "Inactive"),
        },
        {
          label: "Created At",
          value: (u) => new Date(u.createdAt).toLocaleString(),
        },
        {
          label: "Created By",
          value: (u) => getUserName(u.createdBy),
        },
        {
          label: "Updated At",
          value: (u) => new Date(u.updatedAt).toLocaleString(),
        },
        {
          label: "Updated By",
          value: (u) => getUserName(u.updatedBy),
        },
        ...(user.deactivatedBy
          ? [
              {
                label: "Deactivated By",
                value: () => getUserName(user.deactivatedBy),
              },
              {
                label: "Deactivated At",
                value: () =>
                  user.deactivatedAt
                    ? new Date(user.deactivatedAt).toLocaleString()
                    : "N/A",
              },
            ]
          : []),
      ]}
    />
  );
}

// Update User Dialog
export function UpdateUserDialog({
  user,
  open,
  onOpenChange,
}: {
  readonly user: User;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const { updateUser } = useUserMutations();
  const { data: userData } = useGetUserById(user.id);
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUserRole = (session?.user as any)?.role as Role | undefined;
  const isSuperAdmin = currentUserRole === Role.SUPER_ADMIN;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<UserUpdate>({
    defaultValues: {
      name: userData?.name || user.name,
      email: userData?.email || user.email,
      role: userData?.role || user.role,
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
    }
    onOpenChange(newOpen);
  };

  const onSubmit = async (data: UserUpdate) => {
    try {
      await updateUser.mutateAsync({ id: user.id, data });
      toast.success("User updated successfully");
      onOpenChange(false);
      reset();
    } catch (error) {
      toast.error("Failed to update user");
      console.error(error);
    }
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Update User"
      description="Make changes to the user information"
      className="sm:max-w-112.5"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="update-name">Name</Label>
          <Input
            id="update-name"
            placeholder="Enter name"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="update-email">Email</Label>
          <Input
            id="update-email"
            type="email"
            placeholder="Enter email"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="update-role">Role</Label>
          <Select
            onValueChange={(value) => setValue("role", value as Role)}
            defaultValue={userData?.role || user.role}
          >
            <SelectTrigger id="update-role">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={Role.SELLER}>Seller</SelectItem>
              <SelectItem value={Role.MANAGER}>Manager</SelectItem>
              <SelectItem value={Role.ADMIN}>Admin</SelectItem>
              {isSuperAdmin && (
                <SelectItem value={Role.SUPER_ADMIN}>Super Admin</SelectItem>
              )}
            </SelectContent>
          </Select>
          {errors.role && (
            <p className="text-xs text-red-500">{errors.role.message}</p>
          )}
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            className="w-full"
            disabled={updateUser.isPending}
          >
            {updateUser.isPending ? <Spinner className="mr-2 h-4 w-4" /> : null}
            Update User
          </Button>
        </div>
      </form>
    </BaseDialog>
  );
}

// Deactivate User Dialog
export function DeactivateUserDialog({
  user,
  open,
  onOpenChange,
}: {
  readonly user: User;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const { deleteUser } = useUserMutations();
  const { data: session } = useSession();
  const { data: allUsers } = useGetUsers();

  const isCurrentUser = session?.user?.id === user.id;
  const activeAdmins =
    allUsers?.filter(
      (u) => (u.role === "ADMIN" || u.role === "SUPER_ADMIN") && u.isActive,
    ) || [];
  const activeSuperAdmins =
    allUsers?.filter((u) => u.role === "SUPER_ADMIN" && u.isActive) || [];

  const isLastSuperAdmin =
    user.role === "SUPER_ADMIN" && activeSuperAdmins.length === 1;
  const isLastAdmin =
    user.role === "ADMIN" &&
    activeAdmins.length === 1 &&
    activeSuperAdmins.length === 0;

  const handleDeactivate = async () => {
    // Double-check on submit
    if (isCurrentUser) {
      toast.error("You cannot deactivate yourself");
      return;
    }

    if (isLastAdmin || isLastSuperAdmin) {
      toast.error(
        "Cannot deactivate the last administrator/super-admin in the system",
      );
      return;
    }

    try {
      await deleteUser.mutateAsync(user.id);
      toast.success("User deactivated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to deactivate user");
      console.error(error);
    }
  };

  return (
    <ConfirmDialog<User>
      open={open}
      onOpenChange={onOpenChange}
      title="Deactivate User"
      description="Are you sure you want to deactivate this user? They will no longer be able to log in."
      item={user}
      renderItem={(u) => (
        <div className="space-y-4">
          {/* Warning for admin users */}
          {(u.role === "ADMIN" || u.role === "SUPER_ADMIN") && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> You are about to deactivate an{" "}
                {u.role} user!
                {(isLastAdmin || isLastSuperAdmin) &&
                  " This is the last active admin/super-admin in the system."}
              </AlertDescription>
            </Alert>
          )}

          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-semibold">User Name:</p>
            <p className="text-sm">{u.name}</p>
            <p className="text-sm font-semibold mt-2">Email:</p>
            <p className="text-sm">{u.email}</p>
            <p className="text-sm font-semibold mt-2">Role:</p>
            <p className="text-sm">{u.role}</p>
          </div>
        </div>
      )}
      onConfirm={handleDeactivate}
      confirmLabel="Deactivating"
      isLoading={deleteUser.isPending}
      confirmDisabled={isLastAdmin || isLastSuperAdmin || isCurrentUser}
    />
  );
}

// Reactivate User Dialog
export function ReactivateUserDialog({
  user,
  open,
  onOpenChange,
}: {
  readonly user: User;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const { reactivateUser } = useUserMutations();

  const handleReactivate = async () => {
    try {
      await reactivateUser.mutateAsync(user.id);
      toast.success("User reactivated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to reactivate user");
      console.error(error);
    }
  };

  return (
    <ConfirmDialog<User>
      open={open}
      onOpenChange={onOpenChange}
      title="Reactivate User"
      description="Are you sure you want to reactivate this user? They will be able to log in again."
      item={user}
      renderItem={(u) => (
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-semibold">User Name:</p>
          <p className="text-sm">{u.name}</p>
          <p className="text-sm font-semibold mt-2">Email:</p>
          <p className="text-sm">{u.email}</p>
          <p className="text-sm font-semibold mt-2">Role:</p>
          <p className="text-sm">{u.role}</p>
        </div>
      )}
      onConfirm={handleReactivate}
      confirmLabel="Reactivating"
      isLoading={reactivateUser.isPending}
    />
  );
}

// Reset Password Dialog
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
        throw new Error("Failed to reset password");
      }

      const data = await response.json();
      setNewPassword(data.password);
      toast.success("Password reset successfully");
    } catch (error) {
      toast.error("Failed to reset password");
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

        {newPassword ? (
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
