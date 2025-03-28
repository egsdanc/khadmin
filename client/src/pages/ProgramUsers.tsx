import { Card, CardContent } from "@/components/ui/card";
import { ProgramUserList } from "@/components/ProgramUserList";

export default function ProgramUsersPage() {
  return (
    <div className="space-y-3 p-2 sm:p-6 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Program Kullanıcıları</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Program kullanıcılarını görüntüle, düzenle ve yönet
        </p>
      </div>

      <Card>
        <CardContent className="p-0 sm:p-6">
          <ProgramUserList />
        </CardContent>
      </Card>
    </div>
  );
}