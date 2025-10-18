import { Card, CardContent } from "@/components/ui/card";
import PanelUserList from "@/components/PanelUserList";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PanelUsers() {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('panel-users')}</h1>
        <p className="text-muted-foreground">
          {t('view-edit-and-manage-panel-users')}
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <PanelUserList />
        </CardContent>
      </Card>
    </div>
  );
}