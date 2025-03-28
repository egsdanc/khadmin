import { Card, CardContent } from "@/components/ui/card";
import PanelUserList from "@/components/PanelUserList";

export default function PanelUsers() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panel Kullanıcıları</h1>
        <p className="text-muted-foreground">
          Panel kullanıcılarını görüntüle, düzenle ve yönet
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <PanelUserList />
        </CardContent>
      </Card>
    </div>
  );
}