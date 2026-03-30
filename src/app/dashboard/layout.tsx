"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuthStore } from "@/stores/auth-store";
import { UserType } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { ToastProvider } from "@/components/ui/use-toast";
import {
  Users,
  UserPlus,
  ShoppingCart,
  ClipboardList,
  Settings,
  LogOut,
  Home,
  Shield,
  FileText,
  Grid3x3,
  Utensils,
  Package,
  PlusCircle,
  Trophy,
  DoorOpen,
  DollarSign,
  Gamepad2,
  UserCog,
  Watch,
  Gem,
  Archive,
  Truck,
  BarChart3,
  Sparkles,
  ChefHat,
  CalendarDays,
  Layers,
  Activity,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  allowedRoles?: UserType[];
  requiredPermissions?: string[];
  isSection?: boolean;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <Home className="w-4 h-4" />,
  },
  {
    label: "Users",
    href: "/dashboard/users",
    icon: <Users className="w-4 h-4" />,
    allowedRoles: [UserType.ADMIN, UserType.STAFF_MANAGER],
  },
  {
    label: "Create Admin/Staff",
    href: "/dashboard/create-user",
    icon: <UserPlus className="w-4 h-4" />,
    allowedRoles: [UserType.ADMIN],
  },
  {
    label: "Admin Users",
    href: "/dashboard/admin-users",
    icon: <UserCog className="w-4 h-4" />,
    allowedRoles: [UserType.ADMIN],
  },
  {
    label: "Product Categories",
    href: "/dashboard/product-categories",
    icon: <Grid3x3 className="w-4 h-4" />,
    allowedRoles: [UserType.ADMIN, UserType.STAFF_MANAGER],
  },
  {
    label: "Food Categories",
    href: "/dashboard/food-categories",
    icon: <Utensils className="w-4 h-4" />,
    allowedRoles: [UserType.ADMIN, UserType.STAFF_MANAGER],
  },
  {
    label: "Products",
    href: "/dashboard/products",
    icon: <Package className="w-4 h-4" />,
    allowedRoles: [
      UserType.ADMIN,
      UserType.STAFF_MANAGER,
      UserType.STAFF_EDITOR,
    ],
  },
  {
    label: "Add-ons",
    href: "/dashboard/add-ons",
    icon: <PlusCircle className="w-4 h-4" />,
    allowedRoles: [UserType.ADMIN, UserType.STAFF_MANAGER],
  },
  {
    label: "Meal Component Templates",
    href: "/dashboard/meal-component-templates",
    icon: <Layers className="w-4 h-4" />,
    allowedRoles: [UserType.ADMIN, UserType.STAFF_MANAGER],
  },
  {
    label: "Orders",
    href: "/dashboard/orders",
    icon: <ShoppingCart className="w-4 h-4" />,
    allowedRoles: [
      UserType.ADMIN,
      UserType.STAFF_MANAGER,
      UserType.STAFF_EDITOR,
    ],
  },
  {
    label: "Challenges",
    href: "/dashboard/challenges",
    icon: <ClipboardList className="w-4 h-4" />,
    allowedRoles: [UserType.ADMIN, UserType.STAFF_EDITOR],
  },
  {
    label: "Competitions",
    href: "/dashboard/competitions",
    icon: <Trophy className="w-4 h-4" />,
    allowedRoles: [UserType.ADMIN, UserType.STAFF_EDITOR],
  },
  {
    label: "Rooms",
    href: "/dashboard/rooms",
    icon: <DoorOpen className="w-4 h-4" />,
    allowedRoles: [UserType.ADMIN, UserType.STAFF_MANAGER],
  },
  {
    label: "Game Features",
    href: "/dashboard/game-features",
    icon: <Gamepad2 className="w-4 h-4" />,
    allowedRoles: [UserType.ADMIN, UserType.STAFF_MANAGER],
  },
  {
    label: "Sponsored Content",
    href: "/dashboard/sponsored",
    icon: <DollarSign className="w-4 h-4" />,
    allowedRoles: [UserType.ADMIN],
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    icon: <FileText className="w-4 h-4" />,
    allowedRoles: [
      UserType.ADMIN,
      UserType.STAFF_MANAGER,
      UserType.STAFF_VIEWER,
    ],
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: <Settings className="w-4 h-4" />,
    allowedRoles: [UserType.ADMIN],
  },
  // C by AI Section
  {
    label: "C by AI",
    href: "#",
    icon: <Sparkles className="w-4 h-4" />,
    isSection: true,
    allowedRoles: [
      UserType.ADMIN,
      UserType.STAFF_MANAGER,
      UserType.STAFF_EDITOR,
    ],
  },
  {
    label: "Subscription Packages",
    href: "/dashboard/cbyai/packages",
    icon: <Package className="w-4 h-4" />,
    allowedRoles: [UserType.ADMIN, UserType.STAFF_MANAGER],
  },
  {
    label: "Subscribers",
    href: "/dashboard/cbyai/subscribers",
    icon: <Users className="w-4 h-4" />,
    allowedRoles: [UserType.ADMIN, UserType.STAFF_MANAGER],
  },
  {
    label: "AI Meal Deliveries",
    href: "/dashboard/cbyai/meal-deliveries",
    icon: <ChefHat className="w-4 h-4" />,
    allowedRoles: [
      UserType.ADMIN,
      UserType.STAFF_MANAGER,
      UserType.STAFF_EDITOR,
    ],
  },
  {
    label: "Meal Preparations",
    href: "/dashboard/cbyai/meal-preparations",
    icon: <CalendarDays className="w-4 h-4" />,
    allowedRoles: [
      UserType.ADMIN,
      UserType.STAFF_MANAGER,
      UserType.STAFF_EDITOR,
    ],
  },
  // Bracela Health Section
  {
    label: "Bracela Health",
    href: "#",
    icon: <Activity className="w-4 h-4" />,
    isSection: true,
    allowedRoles: [UserType.ADMIN],
  },
  {
    label: "Health Reads",
    href: "/dashboard/bracela/reads",
    icon: <BarChart3 className="w-4 h-4" />,
    allowedRoles: [UserType.ADMIN],
  },
  // Bracelet Store Section
  {
    label: "Bracelet Store",
    href: "#",
    icon: <Gem className="w-4 h-4" />,
    isSection: true,
    allowedRoles: [
      UserType.ADMIN,
      UserType.STAFF_MANAGER,
      UserType.STAFF_EDITOR,
    ],
  },
  {
    label: "Bracelet Products",
    href: "/dashboard/bracelets/products",
    icon: <Watch className="w-4 h-4" />,
    allowedRoles: [
      UserType.ADMIN,
      UserType.STAFF_MANAGER,
      UserType.STAFF_EDITOR,
    ],
  },
  {
    label: "Bracelet Orders",
    href: "/dashboard/bracelets/orders",
    icon: <ShoppingCart className="w-4 h-4" />,
    allowedRoles: [
      UserType.ADMIN,
      UserType.STAFF_MANAGER,
      UserType.STAFF_EDITOR,
    ],
  },
  {
    label: "Inventory Management",
    href: "/dashboard/bracelets/inventory",
    icon: <Archive className="w-4 h-4" />,
    allowedRoles: [UserType.ADMIN, UserType.STAFF_MANAGER],
  },
  {
    label: "Shipment Tracking",
    href: "/dashboard/bracelets/shipments",
    icon: <Truck className="w-4 h-4" />,
    allowedRoles: [
      UserType.ADMIN,
      UserType.STAFF_MANAGER,
      UserType.STAFF_EDITOR,
    ],
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: <BarChart3 className="w-4 h-4" />,
    allowedRoles: [UserType.ADMIN, UserType.STAFF_MANAGER],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout, hasRole } = useAuthStore();

  const filteredNavItems = navItems.filter((item) => {
    if (!item.allowedRoles) return true;
    return hasRole(item.allowedRoles);
  });

  return (
    <ProtectedRoute
      allowedRoles={[
        UserType.ADMIN,
        UserType.STAFF_MANAGER,
        UserType.STAFF_EDITOR,
        UserType.STAFF_VIEWER,
      ]}
    >
      <ToastProvider>
        <div className="min-h-screen flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-900 text-white flex flex-col h-screen fixed">
          {/* Header - Fixed */}
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Admin Panel
            </h2>
          </div>

          {/* Navigation - Scrollable */}
          <nav className="flex-1 overflow-y-auto mt-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            <div className="px-2 pb-4">
              {filteredNavItems.map((item) => {
                if (item.isSection) {
                  return (
                    <div key={item.label} className="mt-6 mb-2">
                      <div className="px-2 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          {item.icon}
                          {item.label}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 mx-1 rounded-lg hover:bg-gray-800 transition-colors duration-200 group ${
                      pathname === item.href
                        ? "bg-blue-600 text-white shadow-lg"
                        : "text-gray-300 hover:text-white"
                    }`}
                  >
                    <span
                      className={`flex-shrink-0 ${
                        pathname === item.href
                          ? "text-white"
                          : "text-gray-400 group-hover:text-white"
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="text-sm font-medium truncate">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer - Fixed */}
          <div className="p-4 border-t border-gray-800 bg-gray-900">
            <div className="mb-4">
              <p className="text-xs text-gray-400">Logged in as:</p>
              <p
                className="font-medium text-sm truncate"
                title={user?.email || user?.phone}
              >
                {user?.email || user?.phone}
              </p>
              {user?.userType && (
                <p className="text-xs text-gray-400 capitalize">
                  {user.userType.replace("_", " ")}
                </p>
              )}
            </div>
            <Button
              onClick={logout}
              variant="sidebar"
              size="sm"
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-gray-50 ml-64">
          <header className="bg-white shadow-sm border-b sticky top-0 z-10">
            <div className="px-6 py-4">
              <h1 className="text-2xl font-semibold text-gray-800">
                {navItems.find(
                  (item) => item.href === pathname && !item.isSection
                )?.label || "Dashboard"}
              </h1>
            </div>
          </header>

          <main className="p-6 min-h-screen">{children}</main>
        </div>
      </div>
      </ToastProvider>
    </ProtectedRoute>
  );
}
