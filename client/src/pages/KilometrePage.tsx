import { Card, CardContent } from "@/components/ui/card";
import { KilometreList } from "@/components/KilometreList";
import { useLanguage } from "@/contexts/LanguageContext";

export default function KilometrePage() {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('kilometre-hacker')}</h1>
        <p className="text-muted-foreground">
          {t('vehicle-mileage-query-operations')}
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