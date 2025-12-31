import { LoginForm } from "@/components/ui/login-form";
import { SignupForm } from "@/components/ui/signup-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Register() {
  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4">
      <Tabs
        defaultValue="login"
        className="w-full max-w-md rounded-lg border p-6"
      >
        <TabsList>
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <LoginForm />
        </TabsContent>
        <TabsContent value="register">
          <SignupForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
