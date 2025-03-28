import { TestList } from "@/components/TestList";

export default function KilometreHackerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kilometre Hacker</h1>
        <p className="text-muted-foreground">
          Kilometre sorgulama ve işlemlerini buradan yapabilirsiniz
        </p>
      </div>
      <div>
        <TestList />
      </div>
    </div>
  );
}