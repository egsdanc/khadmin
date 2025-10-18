import { useState, useRef, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, CalendarIcon, Search, CreditCard } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TablePagination } from "@/components/TablePagination";
import { sipayApi } from "@/lib/sipay-api";
import { useLocation } from "wouter";

interface BakiyeHareketi {
  id: number;
  bayi_id: number;
  bayi_adi: string;
  firma_adi: string;
  bayi_aktif: boolean;
  manuel_yukleme: number;
  iyzico_yukleme: number;
  sipay_yukleme: number;
  miktar: number;
  bakiye_sonrasi: number;
  aciklama?: string;
  created_at: string;
}

declare global {
  interface Window {
    iyzico: any;
    iyziInit: any;
    iyziEventTriggered: boolean | undefined;
  }
}

interface BakiyeHareketleriResponse {
  success: boolean;
  hareketler: BakiyeHareketi[];
  total: number;
  totalPages: number;
}

interface FiltreState {
  startDate: Date | null;
  endDate: Date | null;
  selectedBayiler: string[];
  selectedFirmalar: string[];
  minTutar: string;
  maxTutar: string;
  siralama: string;
}

const BakiyeGecmisi = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;
  const { user } = useAuth();

  // Fetch data with pagination
  const { data: response, isLoading } = useQuery({
    queryKey: ['/api/bakiye/hareketler', currentPage, limit, user?.role, user?.id, user?.bayi_id],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        userRole: user?.role || '',
        userId: user?.id.toString() || '', // Kullanıcının ID'sini parametre olarak ekledik
        bayi_id: user?.bayi_id?.toString() || '', // Kullanıcının ID'sini parametre olarak ekledik

      });

      const response = await fetch(`/api/bakiye/hareketler?${params}`);

      if (!response.ok) {
        const error = await response.text();
        console.error('API Error:', error);
        throw new Error('Network response was not ok');
      }

      return response.json();
    }
  });


  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const hareketler = response?.hareketler || [];
  console.log("hhh", response)
  const total = response?.total || 0;
  const totalPages = response?.totalPages || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bakiye İşlemleri</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Bayi</TableHead>
                <TableHead className="hidden sm:table-cell">Firma</TableHead>
                <TableHead className="hidden sm:table-cell">İşlem Detayı</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
                <TableHead className="hidden md:table-cell">Açıklama</TableHead>
                <TableHead className="text-right">Bakiye</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hareketler.length > 0 ? (
                hareketler.map((hareket: BakiyeHareketi) => (
                  <TableRow key={hareket.id}>
                    <TableCell>{formatDate(hareket.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{hareket.bayi_adi}</span>
                        {!hareket.bayi_aktif && (
                          <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20">
                            Pasif
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {hareket.firma_adi}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="space-y-1">
                        {hareket.manuel_yukleme > 0 && (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700">
                            Manuel Bakiye Yükleme
                          </span>
                        )}
                        {hareket.iyzico_yukleme > 0 && (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-700">
                            iyzico Bakiye Yükleme
                          </span>
                        )}
                        {hareket.sipay_yukleme > 0 && (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                            Sipay Bakiye Yükleme
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span
                        className={
                          hareket.manuel_yukleme > 0 || hareket.iyzico_yukleme > 0 || hareket.sipay_yukleme > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {hareket.manuel_yukleme > 0 || hareket.iyzico_yukleme > 0 || hareket.sipay_yukleme > 0
                          ? `+${formatCurrency(hareket.miktar)}`
                          : `-${formatCurrency(hareket.miktar)}`}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {hareket.aciklama || "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(hareket.bakiye_sonrasi)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-4 text-muted-foreground"
                  >
                    İşlem bulunamadı
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {hareketler.length > 0 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={total}
              itemsPerPage={limit}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const OnlineOdemeSipay = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [selectedFirma, setSelectedFirma] = useState("");
  const [selectedBayi, setSelectedBayi] = useState("");
  const [formOlustu, setFormOlustu] = useState(false);
  const { user } = useAuth();
  const formRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Sipay token servisi test fonksiyonu
  const testSipayToken = async () => {
    console.log("🔄 Sipay token servisine istek atılıyor...");

    try {
      console.log("🔄 Sipay token servisine istek atılıyor...");

      const data = await sipayApi.getToken();

      if (data.status_code === 100 && data.data?.token) {
        console.log("✅ Token başarıyla alındı:", data.data.token);
        console.log("📊 Token detayları:", {
          status_code: data.status_code,
          status_description: data.status_description,
          token_length: data.data.token.length,
          expires_in: data.data.expires_in
        });
        return data.data.token; // Token'ı döndür
      } else {
        console.log("❌ Token alınamadı:", data);
        console.log("🔍 Hata detayları:", {
          status_code: data.status_code,
          status_description: data.status_description,
          error: data.error
        });
        throw new Error(data.status_description || "Token alınamadı");
      }
    } catch (error) {
      console.error("💥 Sipay token hatası:", error);
      throw error;
    }
  };

  // Add firma query
  const { data: firmaResponse } = useQuery<{
    success: boolean;
    data: Array<{ id: number; name: string }>;
  }>({
    queryKey: ["/api/companies"],
  });

  // Add bayiler query
  const { data: bayilerResponse, isLoading: bayiLoading } = useQuery<{
    success: boolean;
    data: Array<{ id: number; ad: string; aktif: boolean; firma: number }>;
  }>({
    queryKey: ["/api/bayiler", selectedFirma],
    queryFn: async () => {
      if (!selectedFirma) {
        return { success: true, data: [] };
      }

      const params = new URLSearchParams({
        firmaId: selectedFirma,
        limit: "1000",
      });

      const response = await fetch(`/api/bayiler?${params}`);
      if (!response.ok) {
        throw new Error("Bayi listesi alınamadı");
      }
      return response.json();
    },
    enabled: selectedFirma !== "",
  });

  // Add filteredBayiler memo
  const filteredBayiler = useMemo(() => {
    const bayiler = bayilerResponse?.data || [];
    if (!selectedFirma) return [];
    return bayiler.filter(bayi => bayi.firma === parseInt(selectedFirma));
  }, [bayilerResponse?.data, selectedFirma]);

  const cleanupIyzicoElements = () => {
    // Clear the form container
    if (formRef.current) {
      formRef.current.innerHTML = '';
    }

    // Remove all iyzico scripts
    const scripts = document.querySelectorAll('script[src*="iyzico"], script[src*="iyzipay"]');
    scripts.forEach(script => script.remove());

    // Remove all potential iyzico divs and forms
    const iyzicoElements = document.querySelectorAll(
      'div[id*="iyzico"], div[id*="iyzi"], div[class*="iyzico"], div[class*="iyzi"],' +
      'form[id*="iyzico"], form[id*="iyzi"], form[class*="iyzico"], form[class*="iyzi"]'
    );
    iyzicoElements.forEach(el => {
      if (el.parentNode) {
        el.innerHTML = '';
      }
    });

    // Clean up global variables
    if (window.iyzico) window.iyzico = undefined;
    if (window.iyziInit) window.iyziInit = undefined;
    if (window.iyziEventTriggered) window.iyziEventTriggered = undefined;
  };

  // Sipay payment mutation
  const sipayPaymentMutation = useMutation({
    mutationFn: async () => {
      console.log("💳 Sipay payment başlatılıyor...");

      const targetBayiId = user?.role === "Super Admin" ? parseInt(selectedBayi) : user?.role === "Admin" ? parseInt(selectedBayi) : user?.bayi_id;

      if (!targetBayiId) {
        throw new Error("Bayi bilgisi bulunamadı");
      }

      const paymentData = {
        amount: parseFloat(amount),
        bayi_id: targetBayiId,
      };

      const result = await sipayApi.createPayment(paymentData);
      return result;
    },
    onSuccess: (data) => {
      console.log("✅ Sipay payment başarılı:", data);

      if (data.success && data.token) {
        toast({
          title: "Başarılı",
          description: `Sipay payment başlatıldı. Token: ${data.token.substring(0, 20)}...`,
        });

        // TODO: Sipay payment form'u burada gösterilecek
        queryClient.invalidateQueries({ queryKey: ["/api/bakiye/hareketler"] });
      } else {
        toast({
          title: "Hata",
          description: "Sipay payment başlatılamadı",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error("💥 Sipay payment hatası:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Sipay payment başlatılırken bir hata oluştu",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kullanıcı bilgisi bulunamadı",
      });
      return;
    }

    // Süper Admin veya Admin için firma ve bayi kontrolü
    if ((user.role === "Super Admin" || user.role === "Admin") && (!selectedFirma || !selectedBayi)) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen firma ve bayi seçiniz",
      });
      return;
    }

    // Tutar kontrolü
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen geçerli bir tutar giriniz",
      });
      return;
    }

    cleanupIyzicoElements();
    setLoading(true);

    try {
      // Önce token al
      console.log("🔄 Ödeme başlatılıyor - Token alınıyor...");
      const token = await testSipayToken();

      console.log("✅ Token alındı, yeni sayfaya yönlendiriliyor...");
      console.log("📋 Token:", token.substring(0, 20) + "...");

      // Token başarıyla alındıysa veriyi sessionStorage'a kaydet
      const targetBayiId = user?.role === "Super Admin" ? parseInt(selectedBayi) : user?.role === "Admin" ? parseInt(selectedBayi) : user?.bayi_id;

      const paymentData = {
        amount: parseFloat(amount),
        bayi_id: targetBayiId,
        token: token
      };

      console.log("📋 SessionStorage'a kaydedilecek veri:", {
        amount: paymentData.amount,
        bayi_id: paymentData.bayi_id,
        token: paymentData.token
      });

      // Veriyi sessionStorage'a kaydet
      sessionStorage.setItem('sipay_payment_data', JSON.stringify(paymentData));

      console.log("✅ Veri sessionStorage'a kaydedildi");

      // Sadece temiz URL ile yönlendir
      setLocation('/bakiye/bakiye-yukle');
      console.log("✅ Yönlendirme tamamlandı");

    } catch (error: any) {
      console.error("💥 Ödeme işlemi hatası:", error);
      console.error("💥 Hata detayları:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Ödeme işlemi başlatılırken bir hata oluştu",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Online Bakiye Yükleme Sipay</CardTitle>
        <CardDescription>Sipay güvenli ödeme altyapısı ile bakiye yükleyebilirsiniz </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {(user?.role === "Super Admin" || user?.role === "Admin") && (
            <>
              <div className="space-y-2">
                <Label>Firma</Label>
                <Select value={selectedFirma} onValueChange={(value) => { setSelectedFirma(value); setSelectedBayi(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Firma Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {firmaResponse?.data?.map(firma => (
                      <SelectItem key={firma.id} value={firma.id.toString()}>{firma.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Bayi</Label>
                <Select value={selectedBayi} onValueChange={setSelectedBayi} disabled={!selectedFirma}>
                  <SelectTrigger>
                    <SelectValue placeholder={selectedFirma ? "Bayi Seçiniz" : "Önce firma seçiniz"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredBayiler.length > 0 ? filteredBayiler.map(bayi => (
                      <SelectItem key={bayi.id} value={bayi.id.toString()}>{bayi.ad}</SelectItem>
                    )) : <SelectItem value="empty">Bayi bulunamadı</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label>Tutar</Label>
            <Input id="amount" type="number" placeholder="Tutar giriniz" value={amount} onChange={(e) => setAmount(e.target.value)} min="1" step="0.01" required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "İşleniyor..." : "Ödeme Yap"}
          </Button>
        </form>

        <div id="iyzipay-checkout-form" ref={formRef} />
      </CardContent>

    </Card>
  );
};

const BakiyeYukle = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFirma, setSelectedFirma] = useState("");
  const [bayi, setBayi] = useState("");
  const [miktar, setMiktar] = useState("");


  const bakiyeYukleMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/bakiye/yukle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bayi_id: bayi,
          miktar: miktar,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Bakiye yükleme işlemi başarıyla tamamlandı",
      });

      // Bakiye geçmişini ve diğer ilgili verileri güncelle
      queryClient.invalidateQueries({ queryKey: ["/api/bakiye/hareketler"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bayiler"] });

      setBayi("");
      setMiktar("");
      setSelectedFirma("");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description:
          error.message || "Bakiye yükleme işlemi sırasında bir hata oluştu",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bayi || !miktar) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen tüm alanları doldurun",
      });
      return;
    }

    const miktar_float = parseFloat(miktar);
    if (isNaN(miktar_float) || miktar_float <= 0) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Geçerli bir miktar giriniz",
      });
      return;
    }

    bakiyeYukleMutation.mutate();
  };

  // Firma listesini getir
  const { data: firmaResponse } = useQuery<{
    success: boolean;
    data: Array<{ id: number; name: string }>;
  }>({
    queryKey: ["/api/companies"],
  });

  const { data: bayilerResponse, isLoading: bayiLoading } = useQuery<{
    success: boolean;
    data: Array<{ id: number; ad: string; aktif: boolean; firma: number }>;
  }>({
    queryKey: ["/api/bayiler", selectedFirma],
    queryFn: async () => {
      if (!selectedFirma) {
        return { success: true, data: [] };
      }

      const params = new URLSearchParams({
        firmaId: selectedFirma,
        limit: "1000",
      });

      const response = await fetch(`/api/bayiler?${params}`);
      if (!response.ok) {
        throw new Error("Bayi listesi alınamadı");
      }
      return response.json();
    },
    enabled: selectedFirma !== "",
  });

  const firmalar = firmaResponse?.data || [];
  const filteredBayiler = useMemo(() => {
    const bayiler = bayilerResponse?.data || [];
    if (!selectedFirma) return [];
    return bayiler.filter(bayi => bayi.firma === parseInt(selectedFirma));
  }, [bayilerResponse?.data, selectedFirma]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bakiye Yükle</CardTitle>
        <CardDescription>
          Bayi seçerek bakiye yüklemesi yapabilirsiniz
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firma">Firma</Label>
              <Select
                value={selectedFirma}
                onValueChange={(value) => {
                  setSelectedFirma(value);
                  setBayi(""); // Firma değiştiğinde bayi seçimini sıfırla
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Firma Seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {firmalar.map((firma) => (
                    <SelectItem key={firma.id} value={firma.id.toString()}>
                      {firma.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bayi">Bayi</Label>
              <Select
                value={bayi}
                onValueChange={setBayi}
                disabled={!selectedFirma}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      selectedFirma ? "Bayi Seçiniz" : "Önce firma seçiniz"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {bayiLoading ? (
                    <SelectItem value="loading">Yükleniyor...</SelectItem>
                  ) : filteredBayiler.length > 0 ? (
                    filteredBayiler.map((b) => (
                      <SelectItem key={b.id} value={b.id.toString()}>
                        {b.ad}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="empty">Bayi bulunamadı</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="miktar">Yüklenecek Tutar</Label>
              <Input
                id="miktar"
                type="number"
                placeholder="Tutar giriniz"
                value={miktar}
                onChange={(e) => setMiktar(e.target.value)}
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={bakiyeYukleMutation.isPending || !bayi || !miktar}
              className="w-[200px]"
            >
              {bakiyeYukleMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Bakiye Yükle
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

const BakiyeYonetimi = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [bayi, setBayi] = useState("");
  const [miktar, setMiktar] = useState("");
  const { user } = useAuth();




  const bakiyeYukleMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/bakiye/yukle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bayi_id: bayi,
          miktar: miktar,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Bakiye yükleme işlemi başarıyla tamamlandı",
      });

      queryClient.invalidateQueries({
        queryKey: ["/api/bakiye/hareketler"],
      });

      setBayi("");
      setMiktar("");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description:
          error.message || "Bakiye yükleme işlemi sırasında bir hata oluştu",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bayi || !miktar) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen tüm alanları doldurun",
      });
      return;
    }

    const miktar_float = parseFloat(miktar);
    if (isNaN(miktar_float) || miktar_float <= 0) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Geçerli bir miktar giriniz",
      });
      return;
    }

    bakiyeYukleMutation.mutate();
  };

  const { data: bayilerResponse, isLoading: bayiLoading } = useQuery<{
    success: boolean;
    data: Array<{ id: number; ad: string; aktif: boolean }>;
  }>({
    queryKey: ["/api/bayiler"],
  });

  const bayiler = bayilerResponse?.data || [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bakiye Yönetimi</h1>
          <p className="text-muted-foreground">
            Test bazlı bakiye yönetimi sistemi
          </p>
        </div>
      </div>

      <Tabs
        defaultValue={
          user?.role === "Admin" || user?.role === "Super Admin"
            ? "bakiye-yukle"
            : "online-odeme-sipay"
        }
      // onValueChange={(value) => {
      //   if (value === "online-odeme" && user?.role === "Bayi") {
      //     window.location.reload(); // Sayfayı yenile
      //   }
      // }}
      >
        <TabsList>
          {user?.role === "Admin" || user?.role === "Super Admin" ? (
            <TabsTrigger value="bakiye-yukle">Bakiye Yükle</TabsTrigger>
          ) : null}
          {/* <TabsTrigger value="online-odeme">Online Ödeme</TabsTrigger> */}
          <TabsTrigger value="online-odeme-sipay">Online Ödeme Sipay</TabsTrigger>

          <TabsTrigger value="bakiye-gecmisi">Bakiye Geçmişi</TabsTrigger>
        </TabsList>

        {user?.role === "Admin" || user?.role === "Super Admin" ? (
          <TabsContent value="bakiye-yukle" className="mt-6">
            <BakiyeYukle />
          </TabsContent>
        ) : null}

        {/* <TabsContent value="online-odeme" className="mt-6">
    <OnlineOdeme />
  </TabsContent> */}
        <TabsContent value="online-odeme-sipay" className="mt-6">
          <OnlineOdemeSipay />
        </TabsContent>

        <TabsContent value="bakiye-gecmisi" className="mt-6">
          <BakiyeGecmisi />
        </TabsContent>
      </Tabs>

    </div>
  );
};


// const OnlineOdeme = () => {
//   const { toast } = useToast();
//   const [loading, setLoading] = useState(false);
//   const [amount, setAmount] = useState("");
//   const [selectedFirma, setSelectedFirma] = useState("");
//   const [selectedBayi, setSelectedBayi] = useState("");
//   const [formOlustu, setFormOlustu] = useState(false);
//   const { user } = useAuth();
//   const formRef = useRef<HTMLDivElement>(null);
//   const queryClient = useQueryClient();

//   // Add firma query
//   const { data: firmaResponse } = useQuery<{
//     success: boolean;
//     data: Array<{ id: number; name: string }>;
//   }>({
//     queryKey: ["/api/companies"],
//   });

//   // Add bayiler query
//   const { data: bayilerResponse, isLoading: bayiLoading } = useQuery<{
//     success: boolean;
//     data: Array<{ id: number; ad: string; aktif: boolean; firma: number }>;
//   }>({
//     queryKey: ["/api/bayiler", selectedFirma],
//     queryFn: async () => {
//       if (!selectedFirma) {
//         return { success: true, data: [] };
//       }

//       const params = new URLSearchParams({
//         firmaId: selectedFirma,
//         limit: "1000",
//       });

//       const response = await fetch(`/api/bayiler?${params}`);
//       if (!response.ok) {
//         throw new Error("Bayi listesi alınamadı");
//       }
//       return response.json();
//     },
//     enabled: selectedFirma !== "",
//   });

//   // Add filteredBayiler memo
//   const filteredBayiler = useMemo(() => {
//     const bayiler = bayilerResponse?.data || [];
//     if (!selectedFirma) return [];
//     return bayiler.filter(bayi => bayi.firma === parseInt(selectedFirma));
//   }, [bayilerResponse?.data, selectedFirma]);

//   const cleanupIyzicoElements = () => {
//     // Clear the form container
//     if (formRef.current) {
//       formRef.current.innerHTML = '';
//     }

//     // Remove all iyzico scripts
//     const scripts = document.querySelectorAll('script[src*="iyzico"], script[src*="iyzipay"]');
//     scripts.forEach(script => script.remove());

//     // Remove all potential iyzico divs and forms
//     const iyzicoElements = document.querySelectorAll(
//       'div[id*="iyzico"], div[id*="iyzi"], div[class*="iyzico"], div[class*="iyzi"],' +
//       'form[id*="iyzico"], form[id*="iyzi"], form[class*="iyzico"], form[class*="iyzi"]'
//     );
//     iyzicoElements.forEach(el => {
//       if (el.parentNode) {
//         el.innerHTML = '';
//       }
//     });

//     // Clean up global variables
//     if (window.iyzico) window.iyzico = undefined;
//     if (window.iyziInit) window.iyziInit = undefined;
//     if (window.iyziEventTriggered) window.iyziEventTriggered = undefined;
//   };


//   const paymentMutation = useMutation({
//     mutationFn: async () => {
//       console.log("aaaaaa",selectedBayi)
//       const response = await fetch("/api/payment/bayi/create", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           amount: parseFloat(amount),
//           bayi_id: user?.role === "Super Admin" ? parseInt(selectedBayi) :  user?.role === "Admin" ? parseInt(selectedBayi) : user?.bayi_id,
//         }),
//         credentials: 'include'
//       });

//       if (!response.ok) {
//         const error = await response.text();
//         throw new Error(error);
//       }
//       return response.json();
//     },
//     onSuccess: (data) => {
//       if (data.checkoutFormContent) {
//         if (formRef.current) {
//           formRef.current.innerHTML = '';
//           const formContainer = document.createElement('div');
//           formContainer.innerHTML = data.checkoutFormContent;

//           const scripts = formContainer.getElementsByTagName('script');
//           Array.from(scripts).forEach(oldScript => {
//             const newScript = document.createElement('script');
//             Array.from(oldScript.attributes).forEach(attr => {
//               newScript.setAttribute(attr.name, attr.value);
//             });
//             newScript.innerHTML = oldScript.innerHTML;
//             formContainer.appendChild(newScript);
//           });

//           formRef.current.appendChild(formContainer);
//           setFormOlustu(true);
//           queryClient.invalidateQueries({ queryKey: ["/api/bakiye/hareketler"] });
//         }
//       } else {
//         toast({
//           title: "Hata",
//           description: "Ödeme sayfası oluşturulamadı",
//           variant: "destructive",
//         });
//       }
//     },
//     onError: (error) => {
//       toast({
//         variant: "destructive",
//         title: "Hata",
//         description: error.message || "Ödeme işlemi başlatılırken bir hata oluştu",
//       });
//     },
//   });

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!user) {
//       toast({
//         variant: "destructive",
//         title: "Hata",
//         description: "Kullanıcı bilgisi bulunamadı",
//       });
//       return;
//     }

//     // Süper Admin veya Admin için firma ve bayi kontrolü
//     if ((user.role === "Super Admin" || user.role === "Admin") && (!selectedFirma || !selectedBayi)) {
//       toast({
//         variant: "destructive",
//         title: "Hata",
//         description: "Lütfen firma ve bayi seçiniz",
//       });
//       return;
//     }

//     // Tutar kontrolü
//     if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
//       toast({
//         variant: "destructive",
//         title: "Hata",
//         description: "Lütfen geçerli bir tutar giriniz",
//       });
//       return;
//     }

//     cleanupIyzicoElements();
//     setLoading(true);
//     try {
//       await paymentMutation.mutateAsync();
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle>Online Bakiye Yükleme</CardTitle>
//         <CardDescription>iyzico güvenli ödeme altyapısı ile bakiye yükleyebilirsiniz</CardDescription>
//       </CardHeader>
//       <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             {(user?.role === "Super Admin" || user?.role === "Admin") && (
//               <>
//                 <div className="space-y-2">
//                   <Label>Firma</Label>
//                   <Select value={selectedFirma} onValueChange={(value) => { setSelectedFirma(value); setSelectedBayi(""); }}>
//                     <SelectTrigger>
//                       <SelectValue placeholder="Firma Seçiniz" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {firmaResponse?.data?.map(firma => (
//                         <SelectItem key={firma.id} value={firma.id.toString()}>{firma.name}</SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div className="space-y-2">
//                   <Label>Bayi</Label>
//                   <Select value={selectedBayi} onValueChange={setSelectedBayi} disabled={!selectedFirma}>
//                     <SelectTrigger>
//                       <SelectValue placeholder={selectedFirma ? "Bayi Seçiniz" : "Önce firma seçiniz"} />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {filteredBayiler.length > 0 ? filteredBayiler.map(bayi => (
//                         <SelectItem key={bayi.id} value={bayi.id.toString()}>{bayi.ad}</SelectItem>
//                       )) : <SelectItem value="empty">Bayi bulunamadı</SelectItem>}
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </>
//             )}
//             <div className="space-y-2">
//               <Label>Tutar</Label>
//               <Input id="amount" type="number" placeholder="Tutar giriniz" value={amount} onChange={(e) => setAmount(e.target.value)} min="1" step="0.01" required />
//             </div>
//             <Button type="submit" className="w-full" disabled={loading}>
//               {loading ? "İşleniyor..." : "Ödeme Yap"}
//             </Button>
//           </form>

//         <div id="iyzipay-checkout-form" ref={formRef} />
//       </CardContent>

//     </Card>
//   );
// };

export default BakiyeYonetimi;
export { BakiyeGecmisi };