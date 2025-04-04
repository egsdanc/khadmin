import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const companySchema = z.object({
  name: z.string().min(1, "Firma adı zorunludur"),
  firma_unvan: z.string().min(1, "Firma ünvanı zorunludur"),
  email: z.string().email("Geçerli bir email adresi giriniz"),
  telefon: z.string().min(1, "Telefon numarası zorunludur"),
  vergi_dairesi: z.string().min(1, "Vergi dairesi zorunludur"),
  vergi_no: z.string().optional(),
  tc_no: z.string().optional(),
  adres: z.string().min(1, "Adres zorunludur"),
  iban: z.string().min(1, "IBAN zorunludur"),
  durum: z.enum(["active", "inactive"]).default("active"),
});

type CompanyFormValues = z.infer<typeof companySchema>;

interface Company {
  id: number;
  name: string;
  firma_unvan: string;
  email: string;
  telefon: string;
  adres: string;
  vergi_dairesi: string;
  vergi_no: string;
  tc_no: string;
  iban: string;
  durum: string;
  test_sayisi: number;
  superadmin_oran: number;
  bakiye: number;
  created_at: string;
  updated_at: string;
}

interface CompanyEditDialogProps {
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompanyEditDialog({ company, open, onOpenChange }: CompanyEditDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      firma_unvan: "",
      email: "",
      telefon: "",
      adres: "",
      vergi_dairesi: "",
      vergi_no: "",
      tc_no: "",
      iban: "",
      durum: "active",
    }
  });

  useEffect(() => {
    if (company) {
      form.reset({
        name: company.name,
        firma_unvan: company.firma_unvan,
        email: company.email,
        telefon: company.telefon,
        adres: company.adres,
        vergi_dairesi: company.vergi_dairesi,
        vergi_no: company.vergi_no,
        tc_no: company.tc_no,
        iban: company.iban,
        durum: company.durum as "active" | "inactive",
      });
    }
  }, [company, form]);

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: CompanyFormValues) => {
      if (!company) return;

      const response = await fetch(`/api/companies/${company.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Firma güncellenirken bir hata oluştu");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: "Başarılı", description: "Firma başarıyla güncellendi" });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({ 
        title: "Hata", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: CompanyFormValues) {
    updateMutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Firma Düzenle</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Firma Adı</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="firma_unvan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Firma Ünvanı</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-posta</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={20} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="adres"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adres</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vergi_dairesi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vergi Dairesi</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vergi_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vergi Numarası</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={50} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tc_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TC Kimlik No</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={20} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="iban"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IBAN</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={50} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                İptal
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Güncelleniyor..." : "Güncelle"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}