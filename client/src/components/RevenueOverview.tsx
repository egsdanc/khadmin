import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function RevenueOverview() {
  const stats = [
    {
      title: "Bayi Gelirleri",
      amount: 571500.00,
      className: "bg-blue-50 text-blue-700",
    },
    {
      title: "Sistem Geliri", 
      amount: 91440.00,
      className: "bg-purple-50 text-purple-700",
    },
    {
      title: "Emre Şahsen Geliri",
      amount: 15240.00,
      className: "bg-green-50 text-green-700",
    },
    {
      title: "Toplam KDV",
      amount: 15240.00,
      className: "bg-pink-50 text-pink-700",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className={stat.className}>
          <CardContent className="p-6">
            <div className="text-sm font-medium">{stat.title}</div>
            <div className="text-2xl font-bold mt-2">
              {formatCurrency(stat.amount)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}