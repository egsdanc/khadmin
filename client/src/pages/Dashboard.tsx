import { Card } from "@/components/ui/card";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ana Sayfa</h1>
        <p className="text-muted-foreground">
          Hoş geldiniz
        </p>
      </div>

      <div className="grid gap-4">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Dashboard</h2>
          <p className="text-muted-foreground">
            Bu sayfa daha sonra güncellenecektir.
          </p>
        </Card>
      </div>
    </div>
  );
}