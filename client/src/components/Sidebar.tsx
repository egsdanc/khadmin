import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  BarChart3,
  Car,
  FileSpreadsheet,
  Gauge,
  Menu,
  Building2,
  UserCircle,
  Percent,
  X,
  PanelLeft,
  ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import React from 'react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Ana Sayfa", path: "/" },
  { icon: Building2, label: "Panel", path: "/panel" },
  { icon: Building2, label: "Firmalar", path: "/firmalar" },
  { icon: Building2, label: "Bayiler", path: "/bayiler" },
  { icon: Users, label: "Panel Kullanıcıları", path: "/panel-users" },
  { icon: UserCircle, label: "Program Kullanıcıları", path: "/users" },
  { icon: Car, label: "VIN Hacker", path: "/vin-hacker" },
  { icon: Gauge, label: "Kilometre Hacker", path: "/kilometre-hacker" },
  { icon: BarChart3, label: "Bakiye Yönetimi", path: "/bakiye" },
  { icon: Percent, label: "Komisyon Yönetimi", path: "/komisyon" },
  { icon: ShoppingBag, label: "Cihaz Satışları", path: "/cihaz-satislari" },
  { icon: FileSpreadsheet, label: "Roller", path: "/roller" },
  { icon: FileText, label: "Raporlar", path: "/raporlar" },
  { icon: Settings, label: "Ayarlar", path: "/ayarlar" },
];

export function MainSidebar({ isOpen, setIsOpen }: SidebarProps) {
  const [location] = useLocation();

  const renderNavItems = () => {
    return menuItems.map((item) => {
      const isActive = location === item.path;
      const Icon = item.icon;

      return (
        <Link key={item.path} href={item.path}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3",
              isActive && "bg-accent text-accent-foreground font-medium"
            )}
            onClick={() => setIsOpen(false)}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </Button>
        </Link>
      );
    });
  };

  return (
    <>
      {/* Mobil Menü */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b">
              <h2 className="text-lg font-semibold">Kilometre Hacker</h2>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-2 overflow-y-auto">
              {renderNavItems()}
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40",
          "w-64 bg-white shadow-md",
          "hidden lg:flex lg:flex-col"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="h-14 flex items-center px-4 border-b">
            <h2 className="text-lg font-semibold">Kilometre Hacker</h2>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 overflow-y-auto">
            {renderNavItems()}
          </nav>
        </div>
      </aside>
    </>
  );
}