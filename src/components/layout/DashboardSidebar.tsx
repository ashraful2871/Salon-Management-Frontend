"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Scissors,
  LayoutDashboard,
  Calendar,
  Users,
  Package,
  Settings,
  LogOut,
  Store,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/services/auth/auth-utils";

// 2. Add an 'allowedRoles' array to each menu item
const menuItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/dashboard",
    allowedRoles: ["SALON_OWNER", "STAFF", "ADMIN", "CUSTOMER"],
  },
  {
    icon: Calendar,
    label: "Appointments",
    path: "/dashboard/appointments",
    allowedRoles: ["SALON_OWNER", "STAFF", "CUSTOMER"],
  },
  {
    icon: Users,
    label: "Customers",
    path: "/dashboard/customers",
    allowedRoles: ["SALON_OWNER", "STAFF", "ADMIN"], // Customers shouldn't see this
  },
  {
    icon: Package,
    label: "Services",
    path: "/dashboard/services",
    allowedRoles: ["SALON_OWNER", "ADMIN"], // Only owners/admin manage services
  },
  {
    icon: Store,
    label: "My Salon",
    path: "/dashboard/store",
    allowedRoles: ["SALON_OWNER"], // Specific to owners
  },
  {
    icon: ShieldCheck,
    label: "Admin Panel",
    path: "/dashboard/admin",
    allowedRoles: ["ADMIN"], // Only for Super Admins
  },
  {
    icon: Settings,
    label: "Settings",
    path: "/dashboard/settings",
    allowedRoles: ["SALON_OWNER", "STAFF", "ADMIN", "CUSTOMER"],
  },
  {
    icon: Scissors,
    label: "Become a Salon Owner Request",
    path: "/dashboard/become-a-salon-owner-request",
    allowedRoles: ["ADMIN"],
  },
  {
    icon: Scissors,
    label: "Applications Status",
    path: "/dashboard/applications-status",
    allowedRoles: ["SALON_OWNER", "CUSTOMER"],
  },
];

interface DashboardSidebarProps {
  userRole: UserRole; // Renamed to singular for clarity, though 'userRoles' works too
}

export const DashboardSidebar = ({ userRole }: DashboardSidebarProps) => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // 3. Filter the menu items based on the current userRole
  const filteredNav = menuItems.filter((item) =>
    item.allowedRoles.includes(userRole)
  );

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-rose">
                <Scissors className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-serif text-xl font-semibold text-sidebar-foreground">
                Dashboard
              </span>
            </Link>
          )}
          {collapsed && (
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-rose">
              <Scissors className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Navigation - Uses filteredNav instead of menuItems */}
        <nav className="flex-1 space-y-1 p-4">
          {filteredNav.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background shadow-soft"
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive",
              collapsed && "justify-center"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </Button>
        </div>
      </div>
    </motion.aside>
  );
};
