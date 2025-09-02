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
      <div className="flex min-h-screen bg-background">
        {/* Enhanced Sidebar with better styling */}
        <Sidebar className="hidden md:flex md:flex-col border-r border-border/40 bg-card/50 backdrop-blur-sm">
          <SidebarHeader className="border-b border-border/40 px-6 py-4">
            <Link href="/dashboard" className="flex items-center gap-3 transition-opacity hover:opacity-80">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10">
                <AppLogo />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-sidebar-foreground">
                  GatherFlow
                </span>
                <span className="text-xs text-sidebar-foreground/60">
                  Event Management
                </span>
              </div>
            </Link>
          </SidebarHeader>
          
          <SidebarContent className="flex-1 px-3 py-4">
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Dashboard" className="group relative overflow-hidden">
                  <Link href="/dashboard">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></div>
                    <Home className="relative z-10" />
                    <span className="relative z-10">Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarGroup className="mt-6">
                <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
                  Events
                </SidebarGroupLabel>
                <div className="space-y-1">
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="All Events" className="group relative overflow-hidden">
                      <Link href="/dashboard/events">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></div>
                        <Calendar className="relative z-10" />
                        <span className="relative z-10">All Events</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Create Event" className="group relative overflow-hidden">
                      <Link href="/dashboard/events/create">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></div>
                        <CalendarPlus className="relative z-10" />
                        <span className="relative z-10">Create Event</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </div>
              </SidebarGroup>

              <SidebarGroup className="mt-6">
                <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
                  Operations
                </SidebarGroupLabel>
                <div className="space-y-1">
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Scanner" className="group relative overflow-hidden">
                      <Link href="/dashboard/scanner">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></div>
                        <ScanLine className="relative z-10" />
                        <span className="relative z-10">Scanner</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </div>
              </SidebarGroup>

              <SidebarGroup className="mt-6">
                <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
                  Analytics
                </SidebarGroupLabel>
                <div className="space-y-1">
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Analytics" className="group relative overflow-hidden">
                      <Link href="/dashboard/analytics">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></div>
                        <BarChart className="relative z-10" />
                        <span className="relative z-10">Analytics</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Reports" className="group relative overflow-hidden">
                      <Link href="/dashboard/reports">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></div>
                        <FileDown className="relative z-10" />
                        <span className="relative z-10">Reports</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </div>
              </SidebarGroup>
            </SidebarMenu>
          </SidebarContent>
          
          <SidebarFooter className="border-t border-border/40 p-3">
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Profile" className="group relative overflow-hidden">
                  <Link href="/dashboard/profile">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></div>
                    <User className="relative z-10" />
                    <span className="relative z-10">Profile</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Settings" className="group relative overflow-hidden">
                  <Link href="/dashboard/settings">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></div>
                    <Settings className="relative z-10" />
                    <span className="relative z-10">Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            
            <form action={logout} className="w-full mt-2">
              <Button 
                type="submit" 
                variant="ghost" 
                className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-destructive/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></div>
                <LogOut className="relative z-10 h-4 w-4" />
                <span className="relative z-10">Logout</span>
              </Button>
            </form>
          </SidebarFooter>
        </Sidebar>
        
        {/* Enhanced Main Content Area */}
        <div className="flex flex-1 flex-col min-w-0 bg-gradient-to-br from-background to-secondary/5">
          {/* Enhanced Header */}
          <div className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-md">
            <DashboardHeader />
          </div>
          
          {/* Main Content with better spacing and constraints */}
          <main className="flex-1 relative">
            {/* Background decoration for large screens */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-secondary/[0.02] pointer-events-none"></div>
            <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-primary/[0.03] to-secondary/[0.03] rounded-full blur-3xl opacity-50 pointer-events-none hidden xl:block"></div>
            <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-tl from-secondary/[0.02] to-primary/[0.02] rounded-full blur-3xl opacity-30 pointer-events-none hidden xl:block"></div>
            
            {/* Full-width Content Container */}
            <div className="relative z-10 h-full w-full">
              <div className="w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                <div className="min-h-[calc(100vh-12rem)] flex flex-col w-full">
                  {/* Content wrapper with full width */}
                  <div className="flex-1 w-full">
                    {children}
                  </div>
                  
                  {/* Footer spacing for better visual balance on large screens */}
                  <div className="mt-auto pt-12 hidden xl:block w-full">
                    <div className="text-center text-sm text-muted-foreground/40">
                      <div className="w-full h-px bg-gradient-to-r from-transparent via-border/20 to-transparent mb-4"></div>
                      GatherFlow Dashboard • Event Management Platform
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}