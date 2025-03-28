import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/companies/DataTable";
import { columns } from "@/components/companies/Columns";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Company } from "@/components/companies/Columns";
import { useState } from "react";
import { CompanyDialog } from "@/components/CompanyDialog";

export default function Companies() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const { data: companies, isLoading, error } = useQuery<{ success: boolean; data: Company[] }>({
    queryKey: ["/api/companies"],
    retry: 1,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Firmalar</h1>
        </div>
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    console.error("[Companies Page] Render error:", error);
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Firmalar</h1>
        </div>
        <div className="flex items-center justify-center h-[400px] text-destructive">
          {error instanceof Error ? error.message : "Firma verileri yüklenirken bir hata oluştu"}
        </div>
      </div>
    );
  }

  const companyData = companies?.data || [];

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Firmalar</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Yeni Firma Ekle
        </Button>
      </div>
      {companyData.length === 0 ? (
        <div className="text-center text-muted-foreground">
          Henüz firma bulunmuyor
        </div>
      ) : (
        <DataTable columns={columns} data={companyData} />
      )}
      <CompanyDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}