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
import { useLanguage } from "@/contexts/LanguageContext";

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  firma_unvan: z.string().min(1, "Company title is required"),
  email: z.string().email("Please enter a valid email address"),
  telefon: z.string().min(1, "Phone number is required"),
  vergi_dairesi: z.string().min(1, "Tax office is required"),
  vergi_no: z.string().optional(),
  tc_no: z.string().optional(),
  adres: z.string().min(1, "Address is required"),
  iban: z.string().min(1, "IBAN is required"),
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
  const { t } = useLanguage();
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
        throw new Error(t('error-updating-company'));
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: t('success'), description: t('company-updated-successfully') });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({ 
        title: t('error'), 
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
          <DialogTitle>{t('edit-company')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('company-name')}</FormLabel>
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
                    <FormLabel>{t('company-title')}</FormLabel>
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
                    <FormLabel>{t('email')}</FormLabel>
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
                    <FormLabel>{t('phone')}</FormLabel>
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
                    <FormLabel>{t('address')}</FormLabel>
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
                    <FormLabel>{t('tax-office')}</FormLabel>
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
                    <FormLabel>{t('tax-number')}</FormLabel>
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
                    <FormLabel>{t('tc-number')}</FormLabel>
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
                    <FormLabel>{t('iban')}</FormLabel>
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
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? t('updating') : t('update')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}