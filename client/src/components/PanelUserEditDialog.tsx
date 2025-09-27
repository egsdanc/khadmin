import { useEffect, useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface Company {
  id: number;
  name: string;
  firma_unvan: string;
}

interface Dealer {
  id: number;
  ad: string;
  firma: number;
  firma_id: number;
  firma_adi: string;
  firma_unvan: string;
}

interface User {
  id?: number;
  name: string;
  email: string;
  password?: string;
  firma_id: number | null;
  firma_name?: string;
  bayi_id: number | null;
  bayi_name?: string;
  role: string;
  status: string;
  language_preference: string;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().optional(),
  firma_id: z.number().nullable(),
  bayi_id: z.number().nullable(),
  role: z.string(),
  status: z.string(),
  language_preference: z.string()
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultValues: FormValues = {
  name: "",
  email: "",
  password: "",
  firma_id: null,
  bayi_id: null,
  role: "Bayi",
  status: "active",
  language_preference: "tr"
};

export function PanelUserEditDialog({ user, open, onOpenChange }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  // Firmaları getir
  const { data: companiesResponse } = useQuery<{ success: boolean; data: Company[] }>({
    queryKey: ['/api/panel-users/companies'],
    enabled: open,
  });

  const selectedFirmaId = form.watch('firma_id');

  // Bayileri getir - firma seçimine bağlı olarak
  const { data: dealersResponse } = useQuery<{ success: boolean; data: Dealer[] }>({
    queryKey: ['/api/bayiler'],
    enabled: open,
  });

  const companies = companiesResponse?.data || [];
  const dealers = dealersResponse?.data || [];

  // Seçili firmaya ait bayileri filtrele
  const filteredDealers = dealers.filter(dealer =>
    dealer.firma === selectedFirmaId || dealer.firma_id === selectedFirmaId
  );

  // Modal kapandığında formu sıfırla
  useEffect(() => {
    if (!open) {
      // Modal kapandığında formu varsayılan değerlere sıfırla
      form.reset(defaultValues);
    } else if (user) {
      // Modal açıldığında ve düzenleme modundaysa kullanıcı verilerini yükle
      form.reset({
        name: user.name || "",
        email: user.email || "",
        password: "",
        firma_id: user.firma_id,
        bayi_id: user.bayi_id,
        role: user.role || "Bayi",
        status: user.status || "active",
        language_preference: user.language_preference || "tr"
      });
    } else {
      // Modal açıldığında ve ekleme modundaysa varsayılan değerlere sıfırla
      form.reset(defaultValues);
    }
  }, [open, user, form]);

  // Firma seçimi yapıldığında bayi seçimini sıfırla
  useEffect(() => {
    if (selectedFirmaId !== form.getValues('firma_id')) {
      form.setValue('bayi_id', null);
    }
  }, [selectedFirmaId, form]);

  const updateUserMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const url = user?.id ? `/api/panel-users/${user.id}` : '/api/panel-users';
      const method = user?.id ? 'PUT' : 'POST';

      const dataToSend = { ...data };
      if (!dataToSend.password) {
        delete dataToSend.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/panel-users'] });
      toast({
        title: t('success'),
        description: user?.id ? t('user-updated-successfully') : t('user-added-successfully'),
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('operation-failed'),
        variant: "destructive",
      });
    },
  });

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    try {
      await updateUserMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('panel-user')} {user?.id ? t('edit') : t('add')}</DialogTitle>
          <DialogDescription>
            {t('fill-required-information-for-panel-user')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="firma_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('company')}</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      const newFirmaId = value === "none" ? null : parseInt(value);
                      field.onChange(newFirmaId);
                      form.setValue('bayi_id', null);
                    }}
                    value={field.value?.toString() || "none"}
                  >
                    <FormControl>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder={t('select-company')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[160px] overflow-y-auto">
                      <SelectItem value="none">{t('select-company')}</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id.toString()}>
                          {company.name} ({company.firma_unvan})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bayi_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('dealer')}</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                    value={field.value?.toString()}
                    disabled={!selectedFirmaId}
                  >
                    <FormControl>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder={selectedFirmaId ? t('select-dealer') : t('select-company-first')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[140px] overflow-y-auto">
                      {filteredDealers.map((dealer) => (
                        <SelectItem key={dealer.id} value={dealer.id.toString()}>
                          {dealer.ad}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('full-name')}</FormLabel>
                  <FormControl>
                    <Input {...field} className="h-9" />
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
                    <Input type="email" {...field} className="h-9" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('password')} {user?.id && `(${t('leave-empty-to-keep-current')})`}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      {...field}
                      className="h-9"
                      {...(!user?.id && { required: true })}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('role')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder={t('select-role')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Super Admin">Super Admin</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Bayi">Bayi</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('status')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder={t('select-status')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">{t('active')}</SelectItem>
                        <SelectItem value="inactive">{t('inactive')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Dil Seçeneği */}
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="language_preference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('language-preference')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder={t('select-language')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="tr">🇹🇷 Türkçe</SelectItem>
                        <SelectItem value="en">🇺🇸 English</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-9"
              >
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="h-9">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}