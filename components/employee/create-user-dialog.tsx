"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, RefreshCw, Copy, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { Role } from "@prisma/client";

import { UserCreate } from "@/schemas/type-export.schema";
import { BaseDialog } from "@/components/dialog-template";
import { useUserMutations } from "@/hooks/useUser";
import { usePermissionGroups } from "@/hooks/usePermissionGroups";
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
  SelectSeparator,
} from "@/components/ui/select";
import { useSession } from "@/lib/auth-client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generatePassword, copyToClipboard } from "@/lib/password-generator";

export function CreateUserDialog({
  open,
  onOpenChange,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const { addUser } = useUserMutations();
  const { data: session } = useSession();
  const { data: permissionGroups, isPending: loadingGroups } =
    usePermissionGroups();
  const currentUserRole = (session?.user as any)?.role as Role | undefined;
  const isSuperAdmin = currentUserRole === Role.SUPER_ADMIN;

  // Filter permission groups based on role hierarchy and exclude default groups
  const filteredPermissionGroups = useMemo(() => {
    if (!permissionGroups) return [];

    return permissionGroups.filter((group) => {
      // Hide default groups as they are represented by "Base Role" items
      if (group.isDefault) return false;

      // Hierarchy check: ADMIN users cannot see/assign SUPER_ADMIN groups
      if (isSuperAdmin) return true;
      return (
        group.baseRole !== Role.SUPER_ADMIN && group.name !== "SUPER_ADMIN"
      );
    });
  }, [permissionGroups, isSuperAdmin]);

  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const [selectedValue, setSelectedValue] = useState<string>(Role.SELLER);

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
      permissionGroupId: null,
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
      setGeneratedPassword("");
      setPasswordValue("");
      setShowPassword(false);
      setSelectedValue(Role.SELLER);
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
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create user";
      toast.error(errorMessage);
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
            Role / Permission Group <span className="text-red-500">*</span>
          </Label>
          <Select
            onValueChange={(value) => {
              setSelectedValue(value);
              // Check if it's a permission group (starts with "group:")
              if (value.startsWith("group:")) {
                const groupId = value.replace("group:", "");
                setValue("permissionGroupId", groupId);
                // Set role based on the group's base role or default to SELLER
                const group = filteredPermissionGroups?.find(
                  (g) => g.id === groupId,
                );
                setValue("role", (group?.baseRole as Role) || Role.SELLER);
              } else {
                // It's a base role
                setValue("role", value as Role);
                setValue("permissionGroupId", null);
              }
            }}
            value={selectedValue}
          >
            <SelectTrigger id="role">
              <SelectValue placeholder="Select a role or permission group" />
            </SelectTrigger>
            <SelectContent>
              {/* Base Roles */}
              <SelectItem value={Role.SELLER}>Seller (Base Role)</SelectItem>
              <SelectItem value={Role.MANAGER}>Manager (Base Role)</SelectItem>
              <SelectItem value={Role.ADMIN}>Admin (Base Role)</SelectItem>
              {isSuperAdmin && (
                <SelectItem value={Role.SUPER_ADMIN}>
                  Super Admin (Base Role)
                </SelectItem>
              )}

              {/* Permission Groups */}
              {filteredPermissionGroups &&
                filteredPermissionGroups.length > 0 && (
                  <>
                    <SelectSeparator />
                    {filteredPermissionGroups.map((group) => (
                      <SelectItem key={group.id} value={`group:${group.id}`}>
                        {group.name} (Custom Group)
                      </SelectItem>
                    ))}
                  </>
                )}
            </SelectContent>
          </Select>
          {loadingGroups && (
            <p className="text-xs text-muted-foreground">
              Loading permission groups...
            </p>
          )}
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
