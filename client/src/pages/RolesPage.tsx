import { RoleList } from "@/components/RoleList";
import { useLanguage } from "@/contexts/LanguageContext";

export default function RolesPage() {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('roles')}</h1>
        <p className="text-muted-foreground">
          {t('manage-system-user-roles')}
        </p>
      </div>
      <RoleList />
    </div>
  );
}