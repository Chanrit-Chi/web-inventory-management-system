"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (
      !isPending &&
      !session &&
      pathname !== "/user_auth" &&
      !pathname.startsWith("/api")
    ) {
      router.push("/user_auth");
    }
  }, [session, isPending, router, pathname]);

  if (isPending && pathname !== "/user_auth") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">
          <Spinner className="size-8" />
        </div>
      </div>
    );
  }

  if (!session && pathname !== "/user_auth") {
    return null;
  }

  return <>{children}</>;
}
