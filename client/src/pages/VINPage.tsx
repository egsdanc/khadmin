import { Card, CardContent } from "@/components/ui/card";
import { VINList } from "@/components/VINList";

export default function VINPage() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">VIN Hacker</h1>
        <p className="text-muted-foreground">
          Araç VIN ve kilometre sorgulama işlemlerini buradan gerçekleştirebilirsiniz
        </p>
      </div>
      <Card>
        <CardContent className="p-0">
          <VINList />
        </CardContent>
      </Card>
    </div>
  );
}