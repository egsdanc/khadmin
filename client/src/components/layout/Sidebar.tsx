import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Building2,
  Store,
  Users,
  UserSquare2,
  Settings,
  FileBarChart,
  Wallet,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const isAdmin = user?.role === "Admin" || user?.role === "Super Admin";
  const isBayi = user?.role === "Bayi";

  const menuItems = [
    {
      title: "Panel",
      href: "/panel",
      icon: LayoutDashboard,
      show: true,
    },
    {
      title: "Firmalar",
      href: "/firmalar",
      icon: Building2,
      show: isAdmin,
    },
    {
      title: "Bayiler",
      href: "/bayiler",
      icon: Store,
      show: isAdmin,
    },
    {
      title: "Panel Kullanıcıları",
      href: "/panel-users",
      icon: Users,
      show: isAdmin,
    },
    {
      title: "Program Kullanıcıları",
      href: "/kullanicilar",
      icon: UserSquare2,
      show: isAdmin,
    },
    {
      title: "VIN Reader",
      href: "/vinreader",
      icon: UserSquare2,
      show: true,
    },
    {
      title: "Kilometre",
      href: "/kilometre",
      icon: UserSquare2,
      show: true,
    },
    {
      title: "Bakiye Yönetimi",
      href: "/bakiye",
      icon: Wallet,
      show: true,
    },
    {
      title: "Komisyon Yönetimi",
      href: "/komisyon",
      icon: FileBarChart,
      show: true,
    },
    {
      title: "Raporlar",
      href: "/raporlar",
      icon: FileBarChart,
      show: isAdmin,
    },
    {
      title: "Roller",
      href: "/roller",
      icon: UserCog,
      show: isAdmin,
    },
    {
      title: "Ayarlar",
      href: "/ayarlar",
      icon: Settings,
      show: isAdmin,
    },
  ];

  return (
    <aside className="h-screen w-64 border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center border-b px-4">
        <span className="font-semibold">Araç Test Platformu</span>
      </div>
      <nav className="space-y-2 p-4">
        {menuItems
          .filter((item) => item.show)
          .map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;

            return (
              <Link key={item.href} href={item.href}>
                <a
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </a>
              </Link>
            );
          })}
      </nav>
    </aside>
  );
}