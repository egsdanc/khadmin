import { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
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
  const [formData, setFormData] = useState<BayiFormData>({
    ad: '',
    firma: 0,
    tel: '',
    mail: '',
    adres: '',
    il: '',
    ilce: '',
    aktif: 1,
    bayi_oran: 0,
    vergi_dairesi: '',
    vergi_no: ''
  });

  const [isFormReady, setIsFormReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: ilIlceResponse, isLoading: isLoadingIlIlce } = useQuery<{ success: boolean; data: IlIlce[] }>({
    queryKey: ["/api/il-ilce"],
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

  const firmalar = firmalarResponse?.data || [];
  const ilIlceData = ilIlceResponse?.data || [];

  const ilceler = useMemo(() => {
    if (!formData.il) return [];
    const selectedIl = ilIlceData.find(il => il.il === formData.il);
    return selectedIl?.ilceler || [];
  }, [formData.il, ilIlceData]);

  useEffect(() => {
    if (!open) {
      setFormData({
        ad: '',
        firma: 0,
        tel: '',
        mail: '',
        adres: '',
        il: '',
        ilce: '',
        aktif: 1,
        bayi_oran: 0,
        vergi_dairesi: '',
        vergi_no: ''
      });
      setIsFormReady(false);
      return;
    }

    if (isLoadingIlIlce || isLoadingFirmalar) {
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
        il: bayi.il?.trim() || '',
        ilce: bayi.ilce?.trim() || '',
        aktif: bayi.aktif ? 1 : 0,
        bayi_oran: bayi.bayi_oran || 0,
        vergi_dairesi: bayi.vergi_dairesi || '',
        vergi_no: bayi.vergi_no || ''
      });
    }

    setIsFormReady(true);
  }, [bayi, open, isLoadingIlIlce, isLoadingFirmalar]);

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
        throw new Error(errorText || 'Bayi işlemi başarısız oldu');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bayiler"] });
      toast({
        description: bayi?.id ? "Bayi başarıyla güncellendi" : "Bayi başarıyla eklendi",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      console.error('Bayi işlem hatası:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: `İşlem başarısız: ${error.message}`,
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
            <DialogTitle>{bayi?.id ? 'Bayi Düzenle' : 'Yeni Bayi Ekle'}</DialogTitle>
            <DialogDescription>
              Bayi bilgilerini eksiksiz doldurunuz
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Yükleniyor...</span>
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
            <DialogTitle>{bayi?.id ? 'Bayi Düzenle' : 'Yeni Bayi Ekle'}</DialogTitle>
            <DialogDescription>
              Bayi bilgilerini eksiksiz doldurunuz
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="ad">Bayi Adı</Label>
                <Input
                  id="ad"
                  value={formData.ad}
                  onChange={(e) => setFormData(prev => ({ ...prev, ad: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="firma">Firma</Label>
                <Select
                  value={formData.firma ? formData.firma.toString() : ""}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, firma: parseInt(value, 10) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Firma Seçiniz" />
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
                <Label htmlFor="tel">Telefon</Label>
                <Input
                  id="tel"
                  value={formData.tel}
                  onChange={(e) => setFormData(prev => ({ ...prev, tel: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="mail">E-posta</Label>
                <Input
                  id="mail"
                  type="email"
                  value={formData.mail}
                  onChange={(e) => setFormData(prev => ({ ...prev, mail: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vergi_dairesi">Vergi Dairesi</Label>
                  <Input
                    id="vergi_dairesi"
                    value={formData.vergi_dairesi}
                    onChange={(e) => setFormData(prev => ({ ...prev, vergi_dairesi: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="vergi_no">Vergi No</Label>
                  <Input
                    id="vergi_no"
                    value={formData.vergi_no}
                    onChange={(e) => setFormData(prev => ({ ...prev, vergi_no: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="adres">Adres</Label>
                <Input
                  id="adres"
                  value={formData.adres}
                  onChange={(e) => setFormData(prev => ({ ...prev, adres: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="il">İl</Label>
                <Select
                  value={formData.il}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, il: value, ilce: '' }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="İl Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {ilIlceData?.map((il) => (
                      <SelectItem key={il.id} value={il.il}>
                        {il.il}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="ilce">İlçe</Label>
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
                        ? "Önce il seçiniz"
                        : !ilceler.length
                          ? "İlçe bulunamadı"
                          : "İlçe Seçiniz"
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
                <Label htmlFor="bayi_oran">Bayi Oranı (%)</Label>
                <Input
                  id="bayi_oran"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.bayi_oran}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    bayi_oran: e.target.value ? parseFloat(e.target.value) : 0
                  }))}
                />
              </div>

              <div>
                <Label htmlFor="aktif">Durum</Label>
                <Select
                  value={formData.aktif.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, aktif: parseInt(value, 10) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Durum Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Aktif</SelectItem>
                    <SelectItem value="0">Pasif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : 'Kaydet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}