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
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { t, language } = useLanguage();

  console.log('🔧 Sidebar rendered with language:', language);
  console.log('🔧 Sidebar t function:', t);

  const isAdmin = user?.role === "Admin" || user?.role === "Super Admin";
  const isBayi = user?.role === "Bayi";

  const menuItems = [
    {
      title: t('dashboard'),
      href: "/panel",
      icon: LayoutDashboard,
      show: true,
    },
    {
      title: t('companies'),
      href: "/firmalar",
      icon: Building2,
      show: isAdmin,
    },
    {
      title: t('dealers'),
      href: "/bayiler",
      icon: Store,
      show: isAdmin,
    },
    {
      title: t('panel-users'),
      href: "/panel-users",
      icon: Users,
      show: isAdmin,
    },
    {
      title: t('program-users'),
      href: "/kullanicilar",
      icon: UserSquare2,
      show: isAdmin,
    },
    {
      title: t('vin-hacker'),
      href: "/vinreader",
      icon: UserSquare2,
      show: true,
    },
    {
      title: t('kilometre-hacker'),
      href: "/kilometre",
      icon: UserSquare2,
      show: true,
    },
    {
      title: t('balance-management'),
      href: "/bakiye",
      icon: Wallet,
      show: true,
    },
    {
      title: t('commission-management'),
      href: "/komisyon",
      icon: FileBarChart,
      show: true,
    },
    {
      title: t('reports'),
      href: "/raporlar",
      icon: FileBarChart,
      show: isAdmin,
    },
    {
      title: t('roles'),
      href: "/roller",
      icon: UserCog,
      show: isAdmin,
    },
    {
      title: t('settings'),
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
      
      {/* Dil Seçici */}
      <div className="p-4 border-t bg-blue-50 border-blue-200">
        <div className="text-xs text-blue-600 font-medium mb-2">Dil Seçimi</div>
        <LanguageSelector />
      </div>
    </aside>
  );
}