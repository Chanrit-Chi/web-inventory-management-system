"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { User, LogOut } from "lucide-react";
import { Button } from "./ui/button";

function UserAvatar() {
  const { data: session } = useSession();
  const user = session?.user;

  if (!user) return null;

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
          <User className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium">{user.name || user.email}</span>
      </div>
      <Button
        onClick={() => signOut()}
        variant="ghost"
        size="sm"
        className="p-1"
      >
        <LogOut className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default UserAvatar;
