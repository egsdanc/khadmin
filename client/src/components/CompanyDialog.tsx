import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  firma_unvan: z.string().min(1, "Company title is required"),
  email: z.string().email("Please enter a valid email address"),
  telefon: z.string().min(1, "Phone number is required"),
  adres: z.string().min(1, "Address is required"),
  vergi_dairesi: z.string().min(1, "Tax office is required"),
  vergi_no: z.string().optional(),
  tc_no: z.string().optional(),
  iban: z.string().min(1, "IBAN is required"),
});

type CompanyFormValues = z.infer<typeof companySchema>;

interface CompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompanyDialog({ open, onOpenChange }: CompanyDialogProps) {
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
    },
  });

  const createCompany = useMutation({
    mutationFn: async (data: CompanyFormValues) => {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({
        title: t('success'),
        description: t('company-added-successfully'),
      });
      form.reset();
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

  async function onSubmit(data: CompanyFormValues) {
    createCompany.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('add-new-company')}</DialogTitle>
          <DialogDescription>
            {t('add-company-description')}
          </DialogDescription>
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
                      <Input placeholder={t('enter-company-name')} {...field} />
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
                      <Input placeholder={t('enter-company-title')} {...field} />
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
                      <Input placeholder={t('enter-email-address')} {...field} />
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
                      <Input placeholder={t('enter-phone-number')} {...field} />
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
                      <Input placeholder={t('enter-tax-office')} {...field} />
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
                      <Input placeholder={t('enter-tax-number')} {...field} />
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
                      <Input placeholder={t('enter-tc-number')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="adres"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>{t('address')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('enter-address')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="iban"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>{t('iban')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('enter-iban-number')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={createCompany.isPending}>
                {createCompany.isPending ? t('adding') : t('add')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}