import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  PanelLeft,
  Building2,
  Store,
  Wallet,
  Percent,
  Users,
  Car,
  Settings,
  FileBarChart,
  Menu,
  X,
  LogOut,
  FileSpreadsheet,
  ShoppingBag,
  PackageSearch,
} from "lucide-react";
import { UserMenu } from "./UserMenu";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const isAdmin = user?.role === "Admin" || user?.role === "Super Admin";
  const isSuperAdmin = user?.role === "Super Admin";
  const isBayi = user?.role === "Bayi";

  // Define all menu items with their visibility rules
  const allMenuItems = [
    { 
      href: "/panel", 
      label: "Panel", 
      icon: PanelLeft,
      visible: true // visible to all users
    },
    { 
      href: "/firmalar", 
      label: "Firmalar", 
      icon: Building2,
      visible: isAdmin // visible to all users
    },
    { 
      href: "/bayiler", 
      label: "Bayiler", 
      icon: Store,
      visible: isAdmin // visible to all users
    },
    { 
      href: "/bakiye", 
      label: "Bakiye Yönetimi", 
      icon: Wallet,
      visible: true // visible to all users
    },
    { 
      href: "/komisyon", 
      label: "Komisyon Yönetimi", 
      icon: Percent,
      visible: isAdmin // visible to all users
    },
    { 
      href: "/panel-users", 
      label: "Panel Kullanıcıları", 
      icon: Users,
      visible: isAdmin // only visible to Admin and Super Admin
    },
    { 
      href: "/kullanicilar", 
      label: "Program Kullanıcıları", 
      icon: Users,
      visible: isAdmin // only visible to Admin and Super Admin
    },
    { 
      href: "/kilometre", 
      label: "Kilometre Hacker", 
      icon: Car,
      visible: true // visible to all users
    },
    { 
      href: "/vinreader", 
      label: "VIN Hacker", 
      icon: Car,
      visible: true // visible to all users
    },
    { 
      href: "/cihaz-satislari", 
      label: "Cihaz Satışları", 
      icon: ShoppingBag,
      visible: isAdmin // visible to all users
    },
    { 
      href: "/cihaz-satin-al", 
      label: "Cihaz Satın Al", 
      icon: PackageSearch,
      visible: isAdmin // visible to all users
    },
    { 
      href: "/roller", 
      label: "Roller", 
      icon: FileSpreadsheet,
      visible: isAdmin // visible to all users
    },
    { 
      href: "/raporlar", 
      label: "Raporlar", 
      icon: FileBarChart,
      visible: true // visible to all users
    },
    { 
      href: "/blog-ekle", 
      label: "Blog", 
      icon: PanelLeft,
      visible: isAdmin // visible to all users
    },
    { 
      href: "/ayarlar", 
      label: "Ayarlar", 
      icon: Settings,
      visible: true // visible to all users
    },
  ];

  // Filter menu items based on visibility
  const menuItems = allMenuItems.filter(item => item.visible);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40",
          "w-64 bg-white shadow-md",
          "transform transition-transform duration-200 ease-in-out",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-14 items-center justify-between border-b px-4">
          <span className="text-lg font-semibold">Kilometre Hacker</span>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3",
                    isActive && "bg-accent text-accent-foreground font-medium"
                  )}
                  onClick={() => 
                  {
                    if(item.label=== "Bakiye Yönetimi" &&  isBayi )
                    {
              //        window.location.href = "/bakiye";
                    }
                    setIsMobileMenuOpen(false)
                  }
                  
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="border-t p-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Çıkış Yap</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:pl-64">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="fixed left-4 top-3 z-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu className="h-6 w-6" />
        </Button>

        {/* Header */}
        <header className="sticky top-0 z-30 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-full items-center justify-end px-4">
            <UserMenu />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="container py-4">
          {children}
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}