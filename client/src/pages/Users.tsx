import { Card, CardContent } from "@/components/ui/card";
import { ProgramUserList } from "@/components/ProgramUserList";

export default function UsersPage() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Program Kullanıcıları</h1>
        <p className="text-muted-foreground">
          Program kullanıcılarını görüntüle, düzenle ve yönet
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <ProgramUserList />
        </CardContent>
      </Card>
    </div>
  );
}