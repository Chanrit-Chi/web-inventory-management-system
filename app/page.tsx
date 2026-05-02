"use client";

import { useSession } from "@/lib/auth-client";
import { UserNav } from "@/components/auth/user-nav";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BarChart3,
  Users,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  const { data: session, isPending } = useSession();
  const role = (session?.user as { role?: string })?.role || "Unknown";

  const getDashboardHref = () => {
    if (role === "SUPER_ADMIN" || role === "ADMIN") return "/dashboard/admin";
    if (role === "MANAGER") return "/dashboard/manager";
    if (role === "SELLER") return "/dashboard/sale";
    return "/dashboard";
  };

  const features = [
    {
      title: "Point of Sale",
      description: "Fast and intuitive checkout experience for your customers.",
      icon: ShoppingCart,
      color: "bg-blue-500",
      href: "/sales/pos",
    },
    {
      title: "Inventory Control",
      description: "Real-time stock tracking and automated reordering.",
      icon: Package,
      color: "bg-emerald-500",
      href: "/products/product-list",
    },
    {
      title: "Analytics & Reports",
      description: "Deep insights into your sales performance and expenses.",
      icon: BarChart3,
      color: "bg-indigo-500",
      href: "/dashboard/admin",
    },
    {
      title: "Team Management",
      description: "Robust role-based access control for your staff.",
      icon: Users,
      color: "bg-orange-500",
      href: "/employee",
    },
  ];

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="size-10" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/10">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
              <Package className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="font-bold tracking-tight sm:text-lg">
              Inventory <span className="text-primary">Master</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {session ? (
              <UserNav />
            ) : (
              <Link href="/user_auth">
                <Button variant="default" className="rounded-full px-6">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 py-8 lg:py-10">
          {/* Background Decor */}
          <div className="absolute left-1/2 top-0 -z-10 h-[1000px] w-[1000px] -translate-x-1/2 -translate-y-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl" />
          </div>

          <div className="mx-auto max-w-5xl text-center">
            <h2 className="mb-8 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Welcome back to <br />
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Inventory Master
              </span>
            </h2>
            <p className="mx-auto mb-5 max-w-2xl text-lg text-muted-foreground sm:text-lg">
              Make all your inventory management easy, fast, and efficient.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              {session ? (
                <Link href={getDashboardHref()}>
                  <Button size="lg" className="h-14 rounded-full px-5 text-lg">
                    <LayoutDashboard className="mr-2 h-5 w-5" />
                    Enter Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/user_auth">
                    <Button size="lg" className="h-14 rounded-full px-8 text-lg">
                      Start Managing Your Buniness Now!
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="mx-auto max-w-7xl px-3">
          <div className="mb-8 text-center">
            <h3 className="text-xl font-bold">Quick Features</h3>
            <p className="text-muted-foreground">
              Go straight to what you need yo see now!
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <Link
                key={i}
                href={session ? feature.href : "/user_auth"}
                className="group relative flex flex-col rounded-3xl border bg-card p-8 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5"
              >
                <div
                  className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${feature.color} text-white shadow-lg transition-transform group-hover:scale-110`}
                >
                  <feature.icon className="h-7 w-7" />
                </div>
                <h4 className="mb-2 text-xl font-bold">{feature.title}</h4>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
                <div className="mt-auto pt-6">
                  <span className="flex items-center text-sm font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Learn More <ArrowRight className="ml-1 h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

