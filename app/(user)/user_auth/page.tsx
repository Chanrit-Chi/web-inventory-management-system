import { LoginForm } from "@/components/ui/login-form";

export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4">
      <div className="w-full max-w-md rounded-lg border p-6">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Welcome Back</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Sign in to your account to continue
          </p>
        </div>
        <LoginForm />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Need help? Contact your administrator
        </p>
      </div>
    </div>
  );
}
