"use client";

import { useSession, authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function UserNav() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/user_auth");
    router.refresh();
  };

  if (!session) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm">
        <p className="font-medium">{session.user.name}</p>
        <p className="text-muted-foreground">{session.user.email}</p>
      </div>
      <Button onClick={handleSignOut} variant="outline" size="sm">
        Sign Out
      </Button>
    </div>
  );
}
