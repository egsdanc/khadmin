import { Card, CardContent } from "@/components/ui/card";
import { BayiList } from "@/components/BayiList";

export default function BayilerPage() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bayiler</h1>
        <p className="text-muted-foreground">
          Sistemde kayıtlı tüm bayilerin listesi
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <BayiList />
        </CardContent>
      </Card>
    </div>
  );
}