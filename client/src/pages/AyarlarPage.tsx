import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LocationSettings from "./LocationSettings";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AyarlarPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('passwords-do-not-match'),
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/ayarlar/sifre-degistir", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast({
        title: t('success'),
        description: t('password-updated-successfully'),
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('error'),
        description: error instanceof Error ? error.message : t('error-updating-password'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('settings')}</h1>
        <p className="text-muted-foreground">
          {t('manage-account-settings')}
        </p>
      </div>

      <Tabs defaultValue="hesap" className="space-y-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="hesap" className="flex-1 sm:flex-none">{t('account-settings')}</TabsTrigger>
          {(user?.role ===  "Super Admin" || user?.role === "Admin") && (
                    <TabsTrigger value="lokasyon" className="flex-1 sm:flex-none">{t('location-management')}</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="hesap" className="space-y-6">
          <Card>
            <CardHeader className="px-6">
              <CardTitle>{t('profile-information')}</CardTitle>
              <CardDescription>
                {t('basic-account-information')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-6">
              <div className="grid gap-2">
                <Label>{t('full-name')}</Label>
                <Input value={user?.name} disabled />
              </div>
              <div className="grid gap-2">
                <Label>{t('email')}</Label>
                <Input value={user?.email} disabled />
              </div>
              <div className="grid gap-2">
                <Label>{t('role')}</Label>
                <Input value={user?.role} disabled />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-6">
              <CardTitle>{t('change-password')}</CardTitle>
              <CardDescription>
                {t('update-account-password')}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6">
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="currentPassword">{t('current-password')}</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="newPassword">{t('new-password')}</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">{t('confirm-new-password')}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('update-password')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lokasyon">
          <LocationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}