import { Card, CardContent } from "@/components/ui/card";
import { ProgramUserList } from "@/components/ProgramUserList";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ProgramUsersPage() {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-3 p-2 sm:p-6 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">{t('program-users')}</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {t('view-edit-and-manage-program-users')}
        </p>
      </div>

      <Card>
        <CardContent className="p-0 sm:p-6">
          <ProgramUserList />
        </CardContent>
      </Card>
    </div>
  );
}