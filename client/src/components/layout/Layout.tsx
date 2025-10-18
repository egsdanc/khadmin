import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/contexts/LanguageContext";
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

interface Permissions {
  [key: string]: {
    view: boolean;
    create?: boolean;
    edit?: boolean;
    delete?: boolean;
    load?: boolean;
    query?: boolean;
  };
}

export function Layout({ children }: LayoutProps) {
  const { logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [loading, setLoading] = useState(true);

  // const isAdmin = user?.role === "Admin" || user?.role === "Super Admin";
  const isAdmin = user?.role === "Admin";

  const isSuperAdmin = user?.role === "Super Admin";
  const isBayi = user?.role === "Bayi";

  // Fetch permissions based on user role
  useEffect(() => {
    if (user?.role) {
      fetchPermissions(user.role);
    }
  }, [user?.role]);

  const fetchPermissions = async (role: string) => {
    try {
      const response = await fetch(`/api/roles/rolekontrol?role=${role}`);
      const data = await response.json();

      if (data.success) {
        setPermissions(data.data);
      } else {
        console.error("Rol izinleri alınamadı:", data.message);
      }
    } catch (error) {
      console.error("Rol izinleri alınırken hata oluştu:", error);
    } finally {
      setLoading(false);
    }
  };

  // Define all menu items with their permission keys
  const allMenuItems = [
    {
      href: "/panel",
      label: t('dashboard'),
      icon: PanelLeft,
      permissionKey: "Panel",
      visible: permissions ? !!permissions["Panel"]?.view : isAdmin || isBayi
    },
    {
      href: "/firmalar",
      label: t('companies'),
      icon: Building2,
      permissionKey: "Firmalar",
      visible: permissions ? !!permissions["Firmalar"]?.view : isAdmin
    },
    {
      href: "/bayiler",
      label: t('dealers'),
      icon: Store,
      permissionKey: "Bayiler",
      visible: permissions ? !!permissions["Bayiler"]?.view : isAdmin
    },
    {
      href: "/bakiye",
      label: t('balance-management'),
      icon: Wallet,
      permissionKey: "Bakiye-Yonetimi",
      visible: permissions ? !!permissions["Bakiye-Yonetimi"]?.view : true
    },
    {
      href: "/komisyon",
      label: t('commission-management'),
      icon: Percent,
      permissionKey: "Komisyon-Yonetimi",
      visible: permissions ? !!permissions["Komisyon-Yonetimi"]?.view : isAdmin
    },
    {
      href: "/panel-users",
      label: t('panel-users'),
      icon: Users,
      permissionKey: "Panel-Kullanicilari",
      visible: permissions ? !!permissions["Panel-Kullanicilari"]?.view : isAdmin
    },
    {
      href: "/kullanicilar",
      label: t('program-users'),
      icon: Users,
      permissionKey: "Program-Kullanicilari",
      visible: permissions ? !!permissions["Program-Kullanicilari"]?.view : isAdmin
    },
    {
      href: "/kilometre",
      label: t('kilometre-hacker'),
      icon: Car,
      permissionKey: "Kilometre-Hacker",
      visible: permissions ? !!permissions["Kilometre-Hacker"]?.view : true
    },
    {
      href: "/vinreader",
      label: t('vin-hacker'),
      icon: Car,
      permissionKey: "VIN-Hacker",
      visible: permissions ? !!permissions["VIN-Hacker"]?.view : true
    },
    {
      href: "/cihaz-satislari",
      label: t('device-sales'),
      icon: ShoppingBag,
      permissionKey: "Cihaz-Satislari",
      visible: permissions ? !!permissions["Cihaz-Satislari"]?.view : isAdmin
    },
    {
      href: "/cihaz-satin-al",
      label: t('buy-device'),
      icon: PackageSearch,
      permissionKey: "Cihaz-Satin-Al",
      visible: permissions ? !!permissions["Cihaz-Satin-Al"]?.view : isAdmin
    },
    {
      href: "/roller",
      label: t('roles'),
      icon: FileSpreadsheet,
      permissionKey: "Roller",
      visible: permissions ? !!permissions["Roller"]?.view : isAdmin
    },
    {
      href: "/raporlar",
      label: t('reports'),
      icon: FileBarChart,
      permissionKey: "Raporlar",
      visible: permissions ? !!permissions["Raporlar"]?.view : true
    },
    {
      href: "/blog-ekle",
      label: t('blog'),
      icon: PanelLeft,
      permissionKey: "Blog",
      visible: permissions ? !!permissions["Blog"]?.view : isSuperAdmin// Blog might not have a permission entry, default to isAdmin
    },
    {
      href: "/ayarlar",
      label: t('settings'),
      icon: Settings,
      permissionKey: "Ayarlar",
      visible: permissions ? !!permissions["Ayarlar"]?.view : true
    },
  ];

  // Filter menu items based on permissions
  const menuItems = allMenuItems.filter(item => {
    if (loading) return false;

    if (isSuperAdmin) return true; // Super Admin sees everything

    if (permissions && item.permissionKey) {
      const permissionEntry = permissions[item.permissionKey];
      return permissionEntry && permissionEntry.view === true;
    }

    return item.visible;
  });

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>;
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40",
          "w-64 bg-white shadow-md",
          "transform transition-transform duration-200 ease-in-out",
          "flex flex-col",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-14 items-center justify-between border-b px-4 flex-shrink-0">
          <span className="text-sm sm:text-lg font-semibold pl-12 sm:pl-0">Kilometre Hacker</span>
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
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="border-t p-2 flex-shrink-0">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>{t('logout')}</span>
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