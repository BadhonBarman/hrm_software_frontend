import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import DashSideBar from "@/components/dashboard/DashSideBar";
import LogoutButton from "@/components/dashboard/LogoutButton";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

import { Toaster } from "sonner";
import Link from "next/link";
import { BellIcon, User2Icon } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "HRMian",
};

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider defaultOpen>
      <TooltipProvider delayDuration={0}>
        <DashSideBar />

        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          {/* HEADER */}
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 transition-all">
            <SidebarTrigger />

            <div className="flex items-center gap-2">
              {/* Notification */}
              <button
                className="rounded-full border bg-gray-100 p-2.5 hover:bg-gray-200 transition-colors"
                aria-label="Notifications"
              >
                <BellIcon size={18} />
              </button>

              {/* Profile */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/dashboard/profile"
                    className="rounded-full border bg-gray-100 p-2.5 text-gray-500 hover:bg-gray-200 transition-colors"
                  >
                    <User2Icon className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>My Profile</TooltipContent>
              </Tooltip>

              {/* Logout */}
              <LogoutButton />
            </div>
          </header>

          {/* CONTENT */}
          <main className="flex w-full min-w-0 flex-1 flex-col gap-4 p-4 sm:p-6 lg:p-8">
            {children}
          </main>

          {/* <Toaster richColors /> */}
        </SidebarInset>
      </TooltipProvider>
    </SidebarProvider>
  );
}
