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

export default function ProfilePage() {
  const { user } = useAuth();

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
                <Label className="font-medium">Firma ID</Label>
                <div className="text-sm md:text-base bg-muted/50 p-2 rounded-md">
                  {user.firma_id}
                </div>
              </div>
            )}
            {user?.bayi_id && (
              <div className="grid gap-2">
                <Label className="font-medium">Bayi ID</Label>
                <div className="text-sm md:text-base bg-muted/50 p-2 rounded-md">
                  {user.bayi_id}
                </div>
              </div>
            )}
            <div className="grid gap-2">
              <Label className="font-medium">Durum</Label>
              <div className="text-sm md:text-base bg-muted/50 p-2 rounded-md">
                {user?.status || '-'}
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="font-medium">Bakiye</Label>
              <div className="text-sm md:text-base bg-muted/50 p-2 rounded-md">
                {user?.bakiye} TL
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}