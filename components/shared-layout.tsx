import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThemeProvider } from "./theme-provider";

export function SharedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="min-h-full">
          <header className="flex shrink-0 items-center gap-2 px-2 py-1 ">
            <SidebarTrigger className="-ml-5" />
            <h1 className="text-base font-semibold">
              Inventory Management System
            </h1>
          </header>
          <div className="flex flex-1 flex-col p-2">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}
