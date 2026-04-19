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
  CreditCard,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
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
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
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
        <section className="relative overflow-hidden px-6 py-20 lg:py-32">
          {/* Background Decor */}
          <div className="absolute left-1/2 top-0 -z-10 h-[1000px] w-[1000px] -translate-x-1/2 -translate-y-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl" />
          </div>

          <div className="mx-auto max-w-5xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm font-medium">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>Optimizing supply chains globally</span>
            </div>
            <h2 className="mb-8 text-5xl font-extrabold tracking-tight sm:text-7xl">
              Manage Your Business <br />
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                With Intelligence.
              </span>
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              The ultimate inventory management platform designed for speed,
              accuracy, and growth. Empower your team with real-time data.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              {session ? (
                <Link href={getDashboardHref()}>
                  <Button size="lg" className="h-14 rounded-full px-8 text-lg">
                    <LayoutDashboard className="mr-2 h-5 w-5" />
                    Enter Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/user_auth">
                    <Button size="lg" className="h-14 rounded-full px-8 text-lg">
                      Start Your Journey
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-16 text-center">
            <h3 className="text-3xl font-bold">Comprehensive Modules</h3>
            <p className="text-muted-foreground">
              Everything you need to run a modern warehouse and retail operation
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

        {/* Why Choose Us Section */}
        <section className="bg-muted/30 py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-12 lg:grid-cols-3">
              <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                <div className="mb-4 rounded-full bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/30">
                  <Zap className="h-6 w-6" />
                </div>
                <h5 className="mb-2 text-lg font-bold">Lightning Fast</h5>
                <p className="text-sm text-muted-foreground">
                  Optimized for speed. Every millisecond counts in a busy
                  retail environment.
                </p>
              </div>
              <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                <div className="mb-4 rounded-full bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-900/30">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h5 className="mb-2 text-lg font-bold">Enterprise Security</h5>
                <p className="text-sm text-muted-foreground">
                  State-of-the-art encryption and RBAC to keep your sensitive
                  data safe.
                </p>
              </div>
              <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                <div className="mb-4 rounded-full bg-purple-100 p-3 text-purple-600 dark:bg-purple-900/30">
                  <CreditCard className="h-6 w-6" />
                </div>
                <h5 className="mb-2 text-lg font-bold">Cost Effective</h5>
                <p className="text-sm text-muted-foreground">
                  Scale your business without the enterprise price tag.
                  Flexible plans for any size.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-muted-foreground">
          <p>© 2026 InventoryMaster Systems. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

