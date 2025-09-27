import { useEffect, useState, useMemo } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";

// Form şeması
const formSchema = z.object({
  isim: z.string().min(1, "Name is required").trim(),
  macAdress: z.string().min(1, "MAC address is required").trim(),
  firstlogin: z.number(),
  firma_id: z.number().nullable(),
  bayi_id: z.number().nullable(),
  sifre: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
  isim: "",
  macAdress: "",
  firstlogin: 0,
  firma_id: null,
  bayi_id: null,
  sifre: ""
};

interface Props {
  user: ProgramUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Company {
  id: number;
  name: string;
}

interface Dealer {
  id: number;
  ad: string;
  firma: number;
  aktif: number; // API'den 1/0 olarak geliyor
}

interface ProgramUser {
  id: number;
  isim: string;
  macAdress: string;
  firstlogin: number;
  bayi_id: number | null;
  bayi_name: string | null;
  firma_id: number | null;
  firma_name: string | null;
  bayi_aktif: boolean;
  sifre?: string;
}

export function ProgramUserEditDialog({ user, open, onOpenChange }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bayiSearchOpen, setBayiSearchOpen] = useState(false);
  const [bayiSearchTerm, setBayiSearchTerm] = useState("");
  const [selectedBayiName, setSelectedBayiName] = useState<string>("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  // Form verilerini izle
  const selectedFirmaId = form.watch('firma_id');
  const selectedBayiId = form.watch('bayi_id');

  // Firma listesi
  const { data: companiesData = { success: false, data: [] } } = useQuery({
    queryKey: ['/api/companies'],
    queryFn: async () => {
      const response = await fetch('/api/companies');
      if (!response.ok) throw new Error('Firma listesi alınamadı');
      return response.json();
    },
    enabled: open
  });

  // Bayi listesi
  const { data: dealersData = { success: false, data: [] } } = useQuery({
    queryKey: ['/api/bayiler', selectedFirmaId],
    queryFn: async () => {
      console.log('Fetching dealers with params:', { selectedFirmaId });
      const params = new URLSearchParams();

      if (selectedFirmaId) {
        params.append('firmaId', selectedFirmaId.toString());
      }

      // Sayfalama parametrelerini ekle
      params.append('limit', '1000'); // Tüm kayıtları getir
      params.append('offset', '0');

      const response = await fetch(`/api/bayiler?${params}`);
      if (!response.ok) {
        console.error('Bayi listesi alınamadı:', response.status);
        throw new Error('Bayi listesi alınamadı');
      }
      const data = await response.json();
      console.log('API Response:', data);
      return data;
    },
    enabled: open
  });

  // Filtrelenmiş bayiler
  const filteredDealers = useMemo(() => {
    console.log('DealersData:', dealersData);

    if (!dealersData.success) {
      console.log('DealersData is not successful');
      return [];
    }

    let dealers = [...dealersData.data];
    console.log('Initial dealers:', dealers);

    // Aktif bayileri filtrele (API'den 1/0 olarak geliyor)
    dealers = dealers.filter(dealer => dealer.aktif === 1);
    console.log('After active filter:', dealers);

    // Firma filtresi
    if (selectedFirmaId) {
      dealers = dealers.filter(dealer => dealer.firma === selectedFirmaId);
      console.log('After firma filter:', dealers);
    }

    // Arama filtresi
    if (bayiSearchTerm.trim()) {
      const searchTerm = bayiSearchTerm.toLowerCase().trim();
      dealers = dealers.filter(dealer =>
        dealer.ad.toLowerCase().includes(searchTerm)
      );
      console.log('After search filter:', dealers);
    }

    // Alfabetik sırala
    const sortedDealers = dealers.sort((a, b) => a.ad.localeCompare(b.ad));
    console.log('Final sorted dealers:', sortedDealers);

    return sortedDealers;
  }, [dealersData.data, dealersData.success, selectedFirmaId, bayiSearchTerm]);

  // Modal kapandığında formu sıfırla
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset(defaultValues);
      setBayiSearchTerm("");
      setSelectedBayiName("");
    }
    onOpenChange(newOpen);
  };

  // Form değerlerini güncelle
  useEffect(() => {
    if (open && user) {
      form.reset({
        isim: user.isim || "",
        macAdress: user.macAdress || "",
        firstlogin: user.firstlogin || 0,
        firma_id: user.firma_id,
        bayi_id: user.bayi_id,
        sifre: ""
      });

      if (user.bayi_name) {
        setSelectedBayiName(user.bayi_name);
      }
    }
  }, [open, user, form]);

  // Seçili bayi adını güncelle
  useEffect(() => {
    if (selectedBayiId && dealersData.success) {
      const selectedDealer = dealersData.data.find((dealer: Dealer) => dealer.id === selectedBayiId);
      if (selectedDealer) {
        setSelectedBayiName(selectedDealer.ad);
      }
    }
  }, [selectedBayiId, dealersData]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);

      const endpoint = user?.id ? `/api/kullanicilar/${user.id}` : '/api/kullanicilar';
      const method = user?.id ? 'PUT' : 'POST';

      // Şifre kontrolü - boşsa veya sadece boşluk karakterlerinden oluşuyorsa body'den çıkar
      const formData = {
        ...data,
        isim: data.isim.trim(),
        macAdress: data.macAdress.trim(),
      };

      // Şifre alanı boş değilse ve sadece boşluklardan oluşmuyorsa ekle
      if (data.sifre?.trim()) {
        formData.sifre = data.sifre.trim();
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Bir hata oluştu');
      }

      if (user?.id) {
        await queryClient.invalidateQueries({ queryKey: ['/api/kullanicilar'] });
        toast({
          title: t('success'),
          description: t('program-user-updated-successfully'),
        });
      } else {
        toast({
          title: t('success'),
          description: t('program-user-added-successfully'),
        });
      }
      handleOpenChange(false);
    } catch (error: any) {
      console.error('Form gönderim hatası:', error);
      toast({
        title: t('error'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('program-user')} {user ? t('edit') : t('add')}</DialogTitle>
          <DialogDescription>
            {t('fill-program-user-info-completely')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="isim"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('name')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="macAdress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('mac-address')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sifre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('password')} {user?.id && `(${t('leave-empty-to-keep-current')})`}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      {...field}
                      placeholder={user ? t('enter-password') : t('enter-new-password')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="firstlogin"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormLabel>{t('first-login')}</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value === 1}
                      onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                    />
                  </FormControl>
                  <span className="text-sm text-muted-foreground">
                    {field.value === 1 ? t('done') : t('not-done')}
                  </span>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="firma_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('company')}</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      const numericValue = value ? parseInt(value) : null;
                      field.onChange(numericValue);
                      form.setValue('bayi_id', null);
                      setBayiSearchTerm("");
                      setSelectedBayiName("");
                    }}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('select-company')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {companiesData.data.map((company: Company) => (
                        <SelectItem key={company.id} value={company.id.toString()}>
                          {company.name}
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
                  <Popover open={bayiSearchOpen} onOpenChange={setBayiSearchOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                          disabled={!selectedFirmaId}
                        >
                          {selectedBayiName || t('select-dealer')}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput
                          placeholder={t('search-dealer')}
                          value={bayiSearchTerm}
                          onValueChange={setBayiSearchTerm}
                        />
                        <ScrollArea className="h-[200px]">
                          {filteredDealers.length === 0 ? (
                            <CommandEmpty>{t('dealer-not-found')}</CommandEmpty>
                          ) : (
                            <CommandGroup>
                              {filteredDealers.map((dealer: Dealer) => (
                                <CommandItem
                                  key={dealer.id}
                                  value={dealer.ad}
                                  onSelect={() => {
                                    field.onChange(dealer.id);
                                    setBayiSearchOpen(false);
                                    setBayiSearchTerm("");
                                    setSelectedBayiName(dealer.ad);
                                  }}
                                >
                                  {dealer.ad}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                        </ScrollArea>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {user ? t('save') : t('add')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}