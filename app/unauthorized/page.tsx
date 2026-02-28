"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";
import { AlertTriangle, ArrowLeft, Home } from "lucide-react";
import { useRouter } from "next/navigation";

type User = {
  role?: string;
};
export default function UnauthorizedPage() {
  const { data: session, isPending } = useSession();
  const userRole = (session?.user as User)?.role ?? "GUEST";
  const RequiredRole = ["SUPER_ADMIN", "ADMIN", "MANAGER"];
  const router = useRouter();

  if (isPending) {
    return null;
  }

  const handleGoBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    // Redirect based on user role
    switch (userRole) {
      case "SELLER":
        router.push("/dashboard/sale");
        break;
      case "MANAGER":
        router.push("/dashboard/manager");
        break;
      case "ADMIN":
      case "SUPER_ADMIN":
        router.push("/dashboard/admin");
        break;
      default:
        router.push("/dashboard");
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold text-destructive">
            Access Denied
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-6">
          <div className="space-y-2">
            <p className="text-muted-foreground">
              You don&apos;t have permission to access this page.
            </p>

            <div className="bg-muted p-3 rounded-lg text-sm">
              <p>
                <strong>Your role:</strong> {userRole}
              </p>
              <p>
                <strong>Required role(s):</strong> {RequiredRole.join(", ")}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Button onClick={handleGoBack} variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>

            <Button onClick={handleGoHome} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            If you believe this is an error, please contact your administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
