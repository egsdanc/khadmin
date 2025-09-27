import { Link, useLocation } from "wouter";
import { MainSidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Menu, User, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { t } = useLanguage();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/login";
    } catch (error) {
      console.error("Çıkış yapılırken hata oluştu:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MainSidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      {/* Ana İçerik */}
      <div className="pl-0 md:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 max-w-screen-2xl items-center">
            {/* Mobil menü butonu */}
            <Button
              variant="ghost"
              size="icon"
              className="mr-2 md:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>

            <div className="flex-1" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>KH</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link href="/profile">
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    {t('profile')}
                  </DropdownMenuItem>
                </Link>
                <Link href="/ayarlar">
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    {t('settings')}
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Sayfa İçeriği */}
        <main className="container min-h-[calc(100vh-3.5rem)] px-4 py-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;