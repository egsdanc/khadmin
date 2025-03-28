import { Card, CardContent } from "@/components/ui/card";
import { KilometreList } from "@/components/KilometreList";

export default function KilometrePage() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kilometre Hacker</h1>
        <p className="text-muted-foreground">
          Araç kilometre sorgulama işlemlerini buradan gerçekleştirebilirsiniz
        </p>
      </div>
      <Card>
        <CardContent className="p-0">
          <KilometreList />
        </CardContent>
      </Card>
    </div>
  );
}