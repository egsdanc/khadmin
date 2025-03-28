import { useState } from "react";
import { Card } from "@/components/ui/card";
import { RoleList } from "@/components/RoleList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoleDialog } from "@/components/RoleDialog";

export default function RollerPage() {
  const [activeTab, setActiveTab] = useState("list");

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Rol Yönetimi</h1>
        <p className="text-muted-foreground">
          Sistem kullanıcı rollerini buradan yönetebilirsiniz
        </p>
      </div>

      <Card className="p-4 md:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="list" className="flex-1 sm:flex-none">Rol Listesi</TabsTrigger>
            <TabsTrigger value="add" className="flex-1 sm:flex-none">Yeni Rol Ekle</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <RoleList />
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            <RoleDialog onClose={() => setActiveTab("list")} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}