import Link from 'next/link';
import {
  CalendarPlus,
  Home,
  LogOut,
  ScanLine,
  User,
  Settings,
  BarChart,
  FileDown,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { logout } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/dashboard-header';
import { AppLogo } from '@/components/app-logo';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar className="hidden md:flex md:flex-col">
          <SidebarHeader>
            <Link href="/dashboard" className="flex items-center gap-2">
              <AppLogo />
              <span className="text-lg font-semibold text-sidebar-foreground">
                GatherFlow
              </span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Dashboard">
                  <Link href="/dashboard">
                    <Home />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarGroup>
                <SidebarGroupLabel>Events</SidebarGroupLabel>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="All Events">
                    <Link href="/dashboard/events">
                      <Calendar />
                      <span>All Events</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Create Event">
                    <Link href="/dashboard/events/create">
                      <CalendarPlus />
                      <span>Create Event</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel>Operations</SidebarGroupLabel>
                 <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Scanner">
                    <Link href="/dashboard/scanner">
                      <ScanLine />
                      <span>Scanner</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarGroup>

              <SidebarGroup>
                 <SidebarGroupLabel>Analytics</SidebarGroupLabel>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Analytics">
                      <Link href="/dashboard/analytics">
                        <BarChart />
                        <span>Analytics</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Reports">
                      <Link href="/dashboard/reports">
                        <FileDown />
                        <span>Reports</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
              </SidebarGroup>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="flex flex-col gap-2">
             <SidebarMenu>
                 <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Profile">
                      <Link href="/dashboard/profile">
                        <User />
                        <span>Profile</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Settings">
                      <Link href="/dashboard/settings">
                        <Settings />
                        <span>Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
              </SidebarMenu>
            <form action={logout} className="w-full">
                <Button type="submit" variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent">
                    <LogOut />
                    <span>Logout</span>
                </Button>
            </form>
          </SidebarFooter>
        </Sidebar>
        <div className="flex flex-1 flex-col">
          <DashboardHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div>{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
