
'use client';
import Link from 'next/link';
import {
  CalendarPlus,
  Home,
  LogOut,
  PanelLeft,
  ScanLine,
  Settings,
  User,
  BarChart,
  Calendar,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { logout } from '@/lib/actions/auth';
import {
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
} from './ui/sidebar';
import { AppLogo } from './app-logo';

export function DashboardSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          size="icon" 
          variant="outline" 
          className="md:hidden group relative overflow-hidden border-2 hover:border-primary/30 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <PanelLeft className="h-5 w-5 relative z-10 group-hover:text-primary transition-colors duration-300" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="left" 
        className="sm:max-w-xs bg-background/80 backdrop-blur-xl border-r border-border/40"
      >
        {/* Enhanced Header */}
        <SidebarHeader className="mb-6 border-b border-border/40 pb-4">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-3 transition-opacity hover:opacity-80 group"
          >
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300 group-hover:scale-110">
              <AppLogo />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-foreground">
                GatherFlow
              </span>
              <span className="text-xs text-foreground/60">
                Event Management
              </span>
            </div>
          </Link>
          <SheetTitle className="sr-only">Menu</SheetTitle>
        </SidebarHeader>

        {/* Enhanced Content */}
        <SidebarContent className="flex-1 px-1">
          <SidebarMenu className="space-y-2">
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                className="group relative overflow-hidden transition-all duration-300 hover:bg-accent/50"
              >
                <Link href="/dashboard">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></div>
                  <Home className="relative z-10 group-hover:text-primary transition-colors duration-200" />
                  <span className="relative z-10 group-hover:text-primary transition-colors duration-200">Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarGroup className="mt-6">
              <SidebarGroupLabel className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-3 px-2">
                Events
              </SidebarGroupLabel>
              <div className="space-y-1">
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    className="group relative overflow-hidden transition-all duration-300 hover:bg-accent/50"
                  >
                    <Link href="/dashboard/events">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></div>
                      <Calendar className="relative z-10 group-hover:text-primary transition-colors duration-200" />
                      <span className="relative z-10 group-hover:text-primary transition-colors duration-200">All Events</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    className="group relative overflow-hidden transition-all duration-300 hover:bg-accent/50"
                  >
                    <Link href="/dashboard/events/create">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></div>
                      <CalendarPlus className="relative z-10 group-hover:text-primary transition-colors duration-200 group-hover:rotate-90" />
                      <span className="relative z-10 group-hover:text-primary transition-colors duration-200">Create Event</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </div>
            </SidebarGroup>

            <SidebarGroup className="mt-6">
              <SidebarGroupLabel className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-3 px-2">
                Operations
              </SidebarGroupLabel>
              <div className="space-y-1">
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    className="group relative overflow-hidden transition-all duration-300 hover:bg-accent/50"
                  >
                    <Link href="/dashboard/scanner">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></div>
                      <ScanLine className="relative z-10 group-hover:text-primary transition-colors duration-200" />
                      <span className="relative z-10 group-hover:text-primary transition-colors duration-200">Scanner</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </div>
            </SidebarGroup>

            <SidebarGroup className="mt-6">
              <SidebarGroupLabel className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-3 px-2">
                Analytics
              </SidebarGroupLabel>
              <div className="space-y-1">
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    className="group relative overflow-hidden transition-all duration-300 hover:bg-accent/50"
                  >
                    <Link href="/dashboard/analytics">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></div>
                      <BarChart className="relative z-10 group-hover:text-primary transition-colors duration-200" />
                      <span className="relative z-10 group-hover:text-primary transition-colors duration-200">Analytics</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </div>
            </SidebarGroup>
          </SidebarMenu>
        </SidebarContent>

        {/* Enhanced Footer */}
        <SidebarFooter className="border-t border-border/40 pt-4 mt-auto">
          <SidebarMenu className="space-y-1">
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                className="group relative overflow-hidden transition-all duration-300 hover:bg-accent/50"
              >
                <Link href="/dashboard/profile">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></div>
                  <User className="relative z-10 group-hover:text-primary transition-colors duration-200" />
                  <span className="relative z-10 group-hover:text-primary transition-colors duration-200">Profile</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                className="group relative overflow-hidden transition-all duration-300 hover:bg-accent/50"
              >
                <Link href="/dashboard/settings">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></div>
                  <Settings className="relative z-10 group-hover:text-primary transition-colors duration-200" />
                  <span className="relative z-10 group-hover:text-primary transition-colors duration-200">Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          
          {/* Enhanced Logout Button */}
          <form action={logout} className="pt-3">
            <Button 
              type="submit" 
              variant="ghost" 
              className="w-full justify-start gap-2 text-foreground/70 hover:text-foreground group relative overflow-hidden transition-all duration-300 hover:bg-destructive/10"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-destructive/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></div>
              <LogOut className="relative z-10 h-4 w-4 group-hover:text-destructive transition-colors duration-200" />
              <span className="relative z-10 group-hover:text-destructive transition-colors duration-200">Logout</span>
            </Button>
          </form>
          
          {/* Mobile Footer Branding */}
          <div className="mt-4 pt-3 border-t border-border/20">
            <div className="text-center">
              <div className="text-xs text-foreground/40">
                GatherFlow Powered by Tech Inspire SL
              </div>
            </div>
          </div>
        </SidebarFooter>
      </SheetContent>
    </Sheet>
  );
}
