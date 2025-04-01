import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

export default function ProfilePage() {
  const { user } = useAuth();
  const [firmaName, setFirmaName] = useState<string | null>(null);
  const [bayiName, setBayiName] = useState<string | null>(null);

  const { data: dealersData } = useQuery<{ success: boolean; data: { activeCount: number, formattedTotalBalance: string } }>({
    queryKey: ["/api/dealers/stats"],
    queryFn: async () => {
      const params = new URLSearchParams({
        user: JSON.stringify(user),
      });
      const response = await fetch(`/api/dealers/stats?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch dealer stats");
      }
      return response.json();
    }
  });

  const { data: balanceData } = useQuery<{ success: boolean; data: { activeCount: number, formattedTotalBalance: string } }>({
    queryKey: ["/api/bakiye/user-balance"],
    queryFn: async () => {
      const params = new URLSearchParams({
        user: JSON.stringify(user),
      });
      const response = await fetch(`/api/bakiye/user-balance?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch user balance");
      }
      return response.json();
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.firma_id) {
          const response = await fetch(`/api/companies/${user.firma_id}/name`);
          const data = await response.json();
          setFirmaName(data.name);
        }
        if (user?.bayi_id) {
          const response = await fetch(`/api/bayiler/${user.bayi_id}/name`);
          const data = await response.json();
          setBayiName(data.name);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [user?.firma_id, user?.bayi_id]);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Ana Sayfa</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Profil</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Profil</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Profil bilgilerinizi görüntüleyin
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-xl md:text-2xl">Profil Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-4">
            <div className="grid gap-2">
              <Label className="font-medium">Ad Soyad</Label>
              <div className="text-sm md:text-base bg-muted/50 p-2 rounded-md">
                {user?.name || '-'}
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="font-medium">E-posta</Label>
              <div className="text-sm md:text-base bg-muted/50 p-2 rounded-md">
                {user?.email || '-'}
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="font-medium">Rol</Label>
              <div className="text-sm md:text-base bg-muted/50 p-2 rounded-md">
                {user?.role || '-'}
              </div>
            </div>
            {user?.firma_id && (
              <div className="grid gap-2">
                <Label className="font-medium">Firma</Label>
                <div className="text-sm md:text-base bg-muted/50 p-2 rounded-md">
                  {firmaName || 'Yükleniyor...'}
                </div>
              </div>
            )}
            {user?.bayi_id && (
              <div className="grid gap-2">
                <Label className="font-medium">Bayi</Label>
                <div className="text-sm md:text-base bg-muted/50 p-2 rounded-md">
                  {bayiName || 'Yükleniyor...'}
                </div>
              </div>
            )}
            <div className="grid gap-2">
              <Label className="font-medium">Durum</Label>
              <div className="text-sm md:text-base bg-muted/50 p-2 rounded-md">
                {user?.status || '-'}
              </div>
            </div>
            {user?.bayi_id && (
              <div className="grid gap-2">
                <Label className="font-medium">Bakiye Bilgileri</Label>
                <div className="space-y-2">
                  <div className="text-sm md:text-base bg-muted/50 p-2 rounded-md">
                    {user.role === "Bayi" ? "Bayi Bakiyesi" : "Tüm Bayilerin Bakiyesi"}: {balanceData?.data?.formattedTotalBalance || "0,00 ₺"}
                  </div>
                  {user.role !== "Bayi" && (
                    <div className="text-sm md:text-base bg-muted/50 p-2 rounded-md">
                      Aktif Bayi Sayısı: {balanceData?.data?.activeCount || 0}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}