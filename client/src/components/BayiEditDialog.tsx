import { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { Bayi } from "./BayiList";

interface Ulke {
  id: number;
  ulke_adi: string;
  ulke_kodu: string;
}

interface IlIlce {
  id: number;
  il: string;
  ilceler: Array<{ id: number; ilce: string; }>;
}

interface Firma {
  id: number;
  name: string;
  firma_unvan: string;
}

interface BayiFormData {
  id?: number;
  ad: string;
  firma: number;
  tel: string;
  mail: string;
  adres: string;
  ulke_id: number;
  il: string;
  ilce: string;
  aktif: number;
  bayi_oran: number;
  vergi_dairesi: string;
  vergi_no: string;
}

interface BayiEditDialogProps {
  bayi: Bayi | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BayiEditDialog({ bayi, open, onOpenChange }: BayiEditDialogProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<BayiFormData>({
    ad: '',
    firma: 0,
    tel: '',
    mail: '',
    adres: '',
    ulke_id: 1, // Türkiye varsayılan
    il: '',
    ilce: '',
    aktif: 1,
    bayi_oran: 12,
    vergi_dairesi: '',
    vergi_no: ''
  });

  const [isFormReady, setIsFormReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: ulkelerResponse, isLoading: isLoadingUlkeler } = useQuery<{ success: boolean; data: Ulke[] }>({
    queryKey: ["/api/ulkeler"],
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });

  const { data: illerResponse, isLoading: isLoadingIller } = useQuery<{ success: boolean; data: IlIlce[] }>({
    queryKey: [`/api/ulkeler/${formData.ulke_id}/iller`],
    enabled: !!formData.ulke_id,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });

  const { data: ilcelerResponse, isLoading: isLoadingIlceler } = useQuery<{ success: boolean; data: Array<{ id: number; ilce: string; }> }>({
    queryKey: [`/api/ulkeler/${formData.ulke_id}/iller/${encodeURIComponent(formData.il)}/ilceler`],
    enabled: !!formData.ulke_id && !!formData.il,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });

  const { data: firmalarResponse, isLoading: isLoadingFirmalar } = useQuery<{ success: boolean; data: Firma[] }>({
    queryKey: ["/api/companies"],
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });

  const ulkeler = ulkelerResponse?.data || [];
  const firmalar = firmalarResponse?.data || [];
  const iller = illerResponse?.data || [];
  const ilceler = ilcelerResponse?.data || [];

  useEffect(() => {
    if (!open) {
      setFormData({
        ad: '',
        firma: 0,
        tel: '',
        mail: '',
        adres: '',
        ulke_id: 1, // Türkiye varsayılan
        il: '',
        ilce: '',
        aktif: 1,
        bayi_oran: 12,
        vergi_dairesi: '',
        vergi_no: ''
      });
      setIsFormReady(false);
      return;
    }

    if (isLoadingUlkeler || isLoadingIller || isLoadingIlceler || isLoadingFirmalar) {
      setIsFormReady(false);
      return;
    }

    if (bayi) {
      setFormData({
        id: bayi.id,
        ad: bayi.ad || '',
        firma: bayi.firma || 0,
        tel: bayi.telefon || '',
        mail: bayi.email || '',
        adres: bayi.adres || '',
        ulke_id: bayi.ulke_id || 1, // Varsayılan Türkiye
        il: bayi.il?.trim() || '',
        ilce: bayi.ilce?.trim() || '',
        aktif: bayi.aktif ? 1 : 0,
        bayi_oran: bayi.bayi_oran || 12,
        vergi_dairesi: bayi.vergi_dairesi || '',
        vergi_no: bayi.vergi_no || ''
      });
    }

    setIsFormReady(true);
  }, [bayi, open, isLoadingUlkeler, isLoadingIller, isLoadingIlceler, isLoadingFirmalar]);

  const bayiMutation = useMutation({
    mutationFn: async (submitData: BayiFormData) => {
      const url = submitData.id ? `/api/bayiler/bayiupdate/${submitData.id}` : '/api/bayiler';
      const response = await fetch(url, {
        method:'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ad: submitData.ad,
          firma_id: submitData.firma,
          telefon: submitData.tel,
          email: submitData.mail,
          adres: submitData.adres,
          il: submitData.il,
          ilce: submitData.ilce,
          aktif: submitData.aktif === 1,
          bayi_oran: submitData.bayi_oran,
          vergi_dairesi: submitData.vergi_dairesi,
          vergi_no: submitData.vergi_no
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || t('dealer-operation-failed'));
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bayiler"] });
      toast({
        description: bayi?.id ? t('dealer-updated-successfully') : t('dealer-added-successfully'),
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      console.error('Bayi işlem hatası:', error);
      toast({
        variant: "destructive",
        title: t('error'),
        description: `${t('operation-failed')}: ${error.message}`,
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firma) {
      toast({
        title: "Hata",
        description: "Lütfen bir firma seçiniz",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      await bayiMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Form işleme hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isFormReady) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{bayi?.id ? t('edit-dealer') : t('add-new-dealer')}</DialogTitle>
            <DialogDescription>
              {t('fill-dealer-info-completely')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">{t('loading')}</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{bayi?.id ? t('edit-dealer') : t('add-new-dealer')}</DialogTitle>
            <DialogDescription>
              {t('fill-dealer-info-completely')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="ad">{t('dealer-name')}</Label>
                <Input
                  id="ad"
                  value={formData.ad}
                  onChange={(e) => setFormData(prev => ({ ...prev, ad: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="firma">{t('company')}</Label>
                <Select
                  value={formData.firma ? formData.firma.toString() : ""}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, firma: parseInt(value, 10) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('select-company')} />
                  </SelectTrigger>
                  <SelectContent>
                    {firmalar?.map((firma) => (
                      <SelectItem key={firma.id} value={firma.id.toString()}>
                        {firma.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tel">{t('phone')}</Label>
                <Input
                  id="tel"
                  value={formData.tel}
                  onChange={(e) => setFormData(prev => ({ ...prev, tel: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="mail">{t('email')}</Label>
                <Input
                  id="mail"
                  type="email"
                  value={formData.mail}
                  onChange={(e) => setFormData(prev => ({ ...prev, mail: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vergi_dairesi">{t('tax-office')}</Label>
                  <Input
                    id="vergi_dairesi"
                    value={formData.vergi_dairesi}
                    onChange={(e) => setFormData(prev => ({ ...prev, vergi_dairesi: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="vergi_no">{t('tax-number')}</Label>
                  <Input
                    id="vergi_no"
                    value={formData.vergi_no}
                    onChange={(e) => setFormData(prev => ({ ...prev, vergi_no: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="adres">{t('address')}</Label>
                <Input
                  id="adres"
                  value={formData.adres}
                  onChange={(e) => setFormData(prev => ({ ...prev, adres: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="ulke">{t('country')}</Label>
                <Select
                  value={formData.ulke_id ? formData.ulke_id.toString() : ""}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    ulke_id: parseInt(value, 10),
                    il: '', // Ülke değiştiğinde il ve ilçeyi sıfırla
                    ilce: ''
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('select-country')} />
                  </SelectTrigger>
                  <SelectContent>
                    {ulkeler?.map((ulke) => (
                      <SelectItem key={ulke.id} value={ulke.id.toString()}>
                        {ulke.ulke_adi}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="il">{t('city')}</Label>
                <Select
                  value={formData.il}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, il: value, ilce: '' }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('select-city')} />
                  </SelectTrigger>
                  <SelectContent>
                    {iller?.map((il) => (
                      <SelectItem key={il.id} value={il.il}>
                        {il.il}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="ilce">{t('district')}</Label>
                <Select
                  value={formData.ilce}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, ilce: value }));
                  }}
                  disabled={!formData.il || !ilceler.length}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !formData.il
                        ? t('select-city-first')
                        : !ilceler.length
                          ? t('no-districts-found')
                          : t('select-district')
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {ilceler.map((ilce) => (
                      <SelectItem key={ilce.id} value={ilce.ilce}>
                        {ilce.ilce}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bayi_oran">{t('dealer-rate')} (%)</Label>
                <Input
                  id="bayi_oran"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.bayi_oran}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    bayi_oran: e.target.value ? parseFloat(e.target.value) : 12
                  }))}
                />
              </div>

              <div>
                <Label htmlFor="aktif">{t('status')}</Label>
                <Select
                  value={formData.aktif.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, aktif: parseInt(value, 10) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('select-status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{t('active')}</SelectItem>
                    <SelectItem value="0">{t('inactive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('saving')}
                </>
              ) : t('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}