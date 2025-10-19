import { useEffect, useState, useCallback } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
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
  firma_name: string;
  firma_unvan: string;
}

interface User {
  id?: number;
  name: string;
  lastname?: string;
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
  name: z.string().min(1, "Ad zorunludur"),
  lastname: z.string().optional(),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
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
  lastname: "",
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
  const [showPassword, setShowPassword] = useState(false);
  const [emailValidation, setEmailValidation] = useState<{
    isValidating: boolean;
    isValid: boolean | null;
    message: string;
  }>({
    isValidating: false,
    isValid: null,
    message: ""
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  // E-posta kontrolü için debounced function
  const checkEmailAvailability = useCallback(
    async (email: string) => {
      if (!email || !email.includes('@')) {
        setEmailValidation({
          isValidating: false,
          isValid: null,
          message: ""
        });
        return;
      }

      setEmailValidation(prev => ({ ...prev, isValidating: true }));

      try {
        const params = new URLSearchParams({ email });
        if (user?.id) {
          params.append('excludeId', user.id.toString());
        }

        const response = await fetch(`/api/panel-users/check-email?${params}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        const data = await response.json();

        if (data.success) {
          setEmailValidation({
            isValidating: false,
            isValid: !data.exists,
            message: data.message
          });
        } else {
          setEmailValidation({
            isValidating: false,
            isValid: false,
            message: data.message || "E-posta kontrolü yapılamadı"
          });
        }
      } catch (error) {
        setEmailValidation({
          isValidating: false,
          isValid: false,
          message: "E-posta kontrolü yapılamadı"
        });
      }
    },
    [user?.id]
  );

  // Debounced email check
  useEffect(() => {
    const email = form.watch('email');
    const timeoutId = setTimeout(() => {
      checkEmailAvailability(email);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [form.watch('email'), checkEmailAvailability]);

  // Firmaları getir
  const { data: companiesResponse } = useQuery<{ success: boolean; data: Company[] }>({
    queryKey: ['/api/panel-users/companies'],
    enabled: open,
  });

  const selectedFirmaId = form.watch('firma_id');

  // Bayileri getir - firma seçimine bağlı olarak
  const { data: dealersResponse } = useQuery<{ success: boolean; data: Dealer[] }>({
    queryKey: ['/api/bayiler', selectedFirmaId],
    queryFn: async () => {
      if (!selectedFirmaId) {
        return { success: true, data: [] };
      }

      const params = new URLSearchParams({
        firmaId: selectedFirmaId.toString(),
        limit: "1000",
      });

      const response = await fetch(`/api/bayiler?${params}`);
      if (!response.ok) {
        throw new Error("Bayi listesi alınamadı");
      }
      return response.json();
    },
    enabled: open && !!selectedFirmaId,
  });

  const companies = companiesResponse?.data || [];
  const dealers = dealersResponse?.data || [];

  // Modal kapandığında formu sıfırla
  useEffect(() => {
    if (!open) {
      // Modal kapandığında formu varsayılan değerlere sıfırla
      form.reset(defaultValues);
      setEmailValidation({
        isValidating: false,
        isValid: null,
        message: ""
      });
    } else if (user) {
      // Modal açıldığında ve düzenleme modundaysa kullanıcı verilerini yükle
      form.reset({
        name: user.name || "",
        lastname: user.lastname || "",
        email: user.email || "",
        password: user.password || "",
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
      const method = 'POST';

      const dataToSend = { ...data };
      if (!dataToSend.password) {
        delete dataToSend.password;
      }

      console.log('PanelUserEditDialog - Gönderilen veri:', dataToSend);

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
    // E-posta validation kontrolü
    if (emailValidation.isValid === false) {
      toast({
        title: t('error'),
        description: emailValidation.message || "Bu e-posta adresi zaten kullanılıyor",
        variant: "destructive",
      });
      return;
    }

    // E-posta validation devam ediyorsa bekle
    if (emailValidation.isValidating) {
      toast({
        title: t('error'),
        description: "E-posta kontrolü yapılıyor, lütfen bekleyiniz",
        variant: "destructive",
      });
      return;
    }

    // E-posta validation henüz yapılmamışsa veya geçersizse, submit'te kontrol et
    if (emailValidation.isValid === null || emailValidation.isValid === false) {
      if (data.email) {
        try {
          const params = new URLSearchParams({ email: data.email });
          if (user?.id) {
            params.append('excludeId', user.id.toString());
          }

          const response = await fetch(`/api/panel-users/check-email?${params}`, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          const checkData = await response.json();

          if (checkData.success && checkData.exists) {
            toast({
              title: t('error'),
              description: checkData.message || "Bu e-posta adresi zaten kullanılıyor",
              variant: "destructive",
            });
            return;
          }
        } catch (error) {
          console.error('Email check error:', error);
          toast({
            title: t('error'),
            description: "E-posta kontrolü yapılamadı",
            variant: "destructive",
          });
          return;
        }
      }
    }

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
                    onValueChange={(value) => {
                      const selectedBayiId = value ? parseInt(value) : null;
                      field.onChange(selectedBayiId);
                      
                      // Seçilen bayinin firma_id'sini de form'a set et
                      if (selectedBayiId) {
                        const selectedDealer = dealers.find(d => d.id === selectedBayiId);
                        if (selectedDealer && selectedDealer.firma_id) {
                          form.setValue('firma_id', selectedDealer.firma_id);
                        }
                      }
                    }}
                    value={field.value?.toString()}
                    disabled={!selectedFirmaId}
                  >
                    <FormControl>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder={selectedFirmaId ? t('select-dealer') : t('select-company-first')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[140px] overflow-y-auto">
                      {dealers.map((dealer) => (
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

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ad</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-9" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Soyad</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-9" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('email')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type="email" 
                        {...field} 
                        className={`h-9 pr-10 ${
                          emailValidation.isValid === false 
                            ? 'border-red-500 focus:border-red-500' 
                            : emailValidation.isValid === true 
                            ? 'border-green-500 focus:border-green-500' 
                            : ''
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {emailValidation.isValidating && (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        )}
                        {!emailValidation.isValidating && emailValidation.isValid === true && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {!emailValidation.isValidating && emailValidation.isValid === false && (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                  {emailValidation.message && (
                    <p className={`text-sm ${
                      emailValidation.isValid === false 
                        ? 'text-red-500' 
                        : emailValidation.isValid === true 
                        ? 'text-green-500' 
                        : 'text-gray-500'
                    }`}>
                      {emailValidation.message}
                    </p>
                  )}
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
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        {...field}
                        className="h-9 pr-10"
                        {...(!user?.id && { required: true })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
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
              <Button 
                type="submit" 
                disabled={isSubmitting || emailValidation.isValidating || emailValidation.isValid === false} 
                className="h-9"
              >
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