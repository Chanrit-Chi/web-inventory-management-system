"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon } from "lucide-react";

interface ProfileFormData {
  name: string;
  email: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string | null;
}

export function ProfileSettings({ user }: { readonly user: UserProfile }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user.name || "",
      email: user.email || "",
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsUpdating(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update profile");
      }

      toast.success("Profile updated successfully");

      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center gap-6">
        <Avatar className="h-20 w-20">
          <AvatarImage src={user.image || undefined} alt={user.name} />
          <AvatarFallback className="text-lg">
            {user.name?.slice(0, 2).toUpperCase() || (
              <UserIcon className="h-8 w-8" />
            )}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-medium">Profile Picture</h3>
          <p className="text-sm text-muted-foreground">
            Contact your administrator to update your profile picture
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Enter your name"
            {...register("name", { required: "Name is required" })}
          />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            disabled
            className="bg-muted cursor-not-allowed"
            {...register("email")}
          />
          <p className="text-xs text-muted-foreground">
            Email address cannot be changed. Contact your administrator if
            needed.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Role</Label>
          <Input
            type="text"
            disabled
            className="bg-muted cursor-not-allowed"
            value={user.role}
          />
          <p className="text-xs text-muted-foreground">
            Your role is assigned by administrators
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isUpdating || !isDirty}>
          {isUpdating && <Spinner className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
