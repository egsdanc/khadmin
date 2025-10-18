import { Card, CardContent } from "@/components/ui/card";
import { BayiList } from "@/components/BayiList";
import { useLanguage } from "@/contexts/LanguageContext";

export default function BayilerPage() {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('dealers')}</h1>
        <p className="text-muted-foreground">
          {t('dealers-description')}
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