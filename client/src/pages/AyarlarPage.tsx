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

export default function AyarlarPage() {
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
        title: "Hata",
        description: "Yeni şifreler eşleşmiyor",
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
        title: "Başarılı",
        description: "Şifreniz başarıyla güncellendi",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error instanceof Error ? error.message : "Şifre değiştirme işlemi başarısız oldu",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ayarlar</h1>
        <p className="text-muted-foreground">
          Hesap ayarlarınızı buradan yönetebilirsiniz
        </p>
      </div>

      <Tabs defaultValue="hesap" className="space-y-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="hesap" className="flex-1 sm:flex-none">Hesap Ayarları</TabsTrigger>
          <TabsTrigger value="lokasyon" className="flex-1 sm:flex-none">Lokasyon Yönetimi</TabsTrigger>
        </TabsList>

        <TabsContent value="hesap" className="space-y-6">
          <Card>
            <CardHeader className="px-6">
              <CardTitle>Profil Bilgileri</CardTitle>
              <CardDescription>
                Hesabınızla ilgili temel bilgiler
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-6">
              <div className="grid gap-2">
                <Label>Ad Soyad</Label>
                <Input value={user?.name} disabled />
              </div>
              <div className="grid gap-2">
                <Label>E-posta</Label>
                <Input value={user?.email} disabled />
              </div>
              <div className="grid gap-2">
                <Label>Rol</Label>
                <Input value={user?.role} disabled />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-6">
              <CardTitle>Şifre Değiştir</CardTitle>
              <CardDescription>
                Hesabınızın şifresini güncelleyin
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6">
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="currentPassword">Mevcut Şifre</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="newPassword">Yeni Şifre</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
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
                  Şifreyi Güncelle
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