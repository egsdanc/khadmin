import { RoleList } from "@/components/RoleList";

export default function RolesPage() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Roller</h1>
        <p className="text-muted-foreground">
          Sistem kullanıcı rollerini buradan yönetebilirsiniz
        </p>
      </div>
      <RoleList />
    </div>
  );
}