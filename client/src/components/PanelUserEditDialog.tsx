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
}

const formSchema = z.object({
  name: z.string().min(1, "Ad zorunludur"),
  lastname: z.string().optional(),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  password: z.string().optional(),
  firma_id: z.number().nullable(),
  bayi_id: z.number().nullable(),
  role: z.string(),
  status: z.string()
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
  status: "active"
};

export function PanelUserEditDialog({ user, open, onOpenChange }: Props) {
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
    } else if (user) {
      // Modal açıldığında ve düzenleme modundaysa kullanıcı verilerini yükle
      form.reset({
        name: user.name || "",
        lastname: user.lastname || "",
        email: user.email || "",
        password: "",
        firma_id: user.firma_id,
        bayi_id: user.bayi_id,
        role: user.role || "Bayi",
        status: user.status || "active"
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
        title: "Başarılı",
        description: user?.id ? "Kullanıcı başarıyla güncellendi" : "Kullanıcı başarıyla eklendi",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "İşlem başarısız oldu",
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
          <DialogTitle>Panel Kullanıcı {user?.id ? 'Düzenle' : 'Ekle'}</DialogTitle>
          <DialogDescription>
            Panel kullanıcısı için gerekli bilgileri eksiksiz doldurun.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="firma_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Firma</FormLabel>
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
                        <SelectValue placeholder="Firma Seçiniz" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[160px] overflow-y-auto">
                      <SelectItem value="none">Firma Seçiniz</SelectItem>
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
                  <FormLabel>Bayi</FormLabel>
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
                        <SelectValue placeholder={selectedFirmaId ? "Bayi Seçiniz" : "Önce firma seçiniz"} />
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
                  <FormLabel>E-posta</FormLabel>
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
                    Şifre {user?.id && "(Boş bırakılırsa değişmez)"}
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
                    <FormLabel>Rol</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Rol Seçiniz" />
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
                    <FormLabel>Durum</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Durum Seçiniz" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Aktif</SelectItem>
                        <SelectItem value="inactive">Pasif</SelectItem>
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
                İptal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="h-9">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kaydet
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}