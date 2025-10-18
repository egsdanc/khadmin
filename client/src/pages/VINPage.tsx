import { Card, CardContent } from "@/components/ui/card";
import { VINList } from "@/components/VINList";
import { useLanguage } from "@/contexts/LanguageContext";

export default function VINPage() {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('vin-hacker')}</h1>
        <p className="text-muted-foreground">
          {t('vehicle-vin-and-mileage-query-operations')}
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