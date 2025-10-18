import { useState, ChangeEvent, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, CreditCard, ArrowLeft } from "lucide-react";
import { sipayApi, SipayPaymentResponse } from "@/lib/sipay-api";

interface FormData {
  ad: string;
  soyad: string;
  telefon: string;
  email: string;
  adres: string;
  ilce: string;
  sehir: string;
  posta_kodu: string;
  ulke: string;
  not_satici: string;
  amount: number;
}

interface CardData {
  kart_numarasi: string;
  kart_ismi: string;
  son_kullanma_ay: string;
  son_kullanma_yil: string;
  cvv: string;
}

const SipayBakiyeEkrani = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // SessionStorage'dan veriyi al
  const [paymentData, setPaymentData] = useState<{
    amount: number;
    bayi_id: number;
    token: string;
  } | null>(null);

  const [formData, setFormData] = useState<FormData>({
    ad: "",
    soyad: "",
    telefon: "",
    email: "",
    adres: "",
    ilce: "",
    sehir: "",
    posta_kodu: "",
    ulke: "Türkiye",
    not_satici: "",
    amount: 0,
  });

  const [cardData, setCardData] = useState<CardData>({
    kart_numarasi: "",
    kart_ismi: "",
    son_kullanma_ay: "",
    son_kullanma_yil: "",
    cvv: "",
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [paymentResult, setPaymentResult] = useState<SipayPaymentResponse | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState<boolean>(false);
  const [formKey, setFormKey] = useState<number>(0);
  const formRef = useRef<HTMLDivElement>(null);

  // TAKSİT STATE'LERİ
  const [installments, setInstallments] = useState<any[]>([]);
  const [selectedInstallment, setSelectedInstallment] = useState<string>('1');
  const [isLoadingInstallments, setIsLoadingInstallments] = useState(false);

  // Bayi adını getirmek için query
  const { data: bayiData, isLoading: bayiLoading } = useQuery({
    queryKey: ['/api/bayiler', paymentData?.bayi_id],
    queryFn: async () => {
      if (!paymentData?.bayi_id) return null;

      const response = await fetch(`/api/bayiler/${paymentData.bayi_id}`);
      if (!response.ok) {
        throw new Error('Bayi bilgisi alınamadı');
      }
      return response.json();
    },
    enabled: !!paymentData?.bayi_id,
  });

  // Kullanıcının firma bilgilerini getirmek için query
  const { data: firmaData, isLoading: firmaLoading } = useQuery({
    queryKey: ['/api/companies', user?.firma_id],
    queryFn: async () => {
      if (!user?.firma_id) return null;

      const response = await fetch(`/api/companies/${user.firma_id}`);
      if (!response.ok) {
        throw new Error('Firma bilgisi alınamadı');
      }
      return response.json();
    },
    enabled: !!user?.firma_id,
  });

  // Kullanıcının bayi bilgilerini getirmek için query
  const { data: userBayiData, isLoading: userBayiLoading } = useQuery({
    queryKey: ['/api/bayiler', user?.bayi_id],
    queryFn: async () => {
      if (!user?.bayi_id) return null;

      const response = await fetch(`/api/bayiler/${user.bayi_id}`);
      if (!response.ok) {
        throw new Error('Bayi bilgisi alınamadı');
      }
      return response.json();
    },
    enabled: !!user?.bayi_id,
  });

  // Sayfa yüklendiğinde sessionStorage'dan veri al
  useEffect(() => {
    console.log("🔄 SipayBakiyeEkrani sayfası yükleniyor...");
    
    // Giriş yapmış kullanıcı bilgilerini konsola yazdır
    console.log("👤 Giriş yapmış kullanıcı bilgileri:", {
      user: user,
    });

    try {
      // SessionStorage'dan veriyi al
      const storedData = sessionStorage.getItem('sipay_payment_data');

      if (!storedData) {
        console.error("❌ SessionStorage'da veri bulunamadı");
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Ödeme bilgileri bulunamadı. Lütfen tekrar deneyin.",
        });
        setLocation('/bakiye');
        return;
      }

      const parsedData = JSON.parse(storedData);
      console.log("📋 SessionStorage'dan alınan veri:", {
        amount: parsedData.amount,
        bayi_id: parsedData.bayi_id,
        token: parsedData.token
      });

      // Veri kontrolü
      if (!parsedData.amount || !parsedData.bayi_id || !parsedData.token) {
        console.error("❌ Eksik veri:", parsedData);
        sessionStorage.removeItem('sipay_payment_data');
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Geçersiz ödeme bilgileri. Lütfen tekrar deneyin.",
        });
        setLocation('/bakiye');
        return;
      }

      setPaymentData(parsedData);
      console.log("✅ Veri başarıyla yüklendi");

    } catch (error) {
      console.error("💥 SipayBakiyeEkrani yükleme hatası:", error);
      sessionStorage.removeItem('sipay_payment_data');
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Sayfa yüklenirken bir hata oluştu.",
      });
      setLocation('/bakiye');
    }
  }, [setLocation, toast]);

  // Firma ve bayi bilgilerini console'a yazdır
  useEffect(() => {
    console.log("🏢 Kullanıcının firma bilgileri:")
    if (firmaData) {
      console.log("🏢 Kullanıcının firma bilgileri:", {
        firmaData: firmaData,
      });
    }
  }, [firmaData, user?.firma_id]);

  useEffect(() => {
    if (userBayiData) {
      console.log("🏪 Kullanıcının bayi bilgileri:", {
        userBayiData: userBayiData,
      });
    }
  }, [userBayiData, user?.bayi_id]);

  // Auto-fill form data when user and bayi data are available
  useEffect(() => {
    if (user && userBayiData) {
      setFormData(prev => ({
        ...prev,
        ad: user.name || "",
        soyad: user.lastname || "",
        email: user.email || "",
        adres: `${userBayiData?.data?.il || ""} ${userBayiData?.data?.ilce || ""}`.trim(),
        ilce: userBayiData?.data?.il || "",
        sehir: userBayiData?.data?.ilce || "",
        telefon: user.telefon || userBayiData?.data?.telefon || "",
        posta_kodu: userBayiData?.data?.posta_kodu || "",
      }));
    }
  }, [user, userBayiData]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCardChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCardData(prev => ({ ...prev, [name]: value }));

    // Sadece kart numarası değiştiyse ve 6 haneden fazlaysa sorgula
    if (name === 'kart_numarasi') {
      const digits = value.replace(/\D/g, '');
      if (digits.length >= 6) {
        fetchInstallments(digits.slice(0, 6));
      } else {
        setInstallments([]);
        setSelectedInstallment('1');
      }
    }
  };

  // Taksit sorgulama fonksiyonu
  const fetchInstallments = async (first6: string) => {
    if (!paymentData) return;
    setIsLoadingInstallments(true);

    const params = {
      credit_card: first6,
      amount: paymentData.amount,
      currency_code: "TRY",
      is_recurring: 0,
      is_2d: 0,
      token: paymentData.token
    };
    console.log('[getPos] Gönderilen parametreler:', params);

    try {
      const data = await sipayApi.getPos(params);
      console.log('[getPos] Dönen yanıt:', data);
      const installmentList = data.installments || data.data || [];
      // Tek çekim için amount_to_be_paid'i paymentData.amount ile güncelle
      if (
        Array.isArray(installmentList) &&
        installmentList.length > 0 &&
        installmentList[0].installments_number === 1
      ) {
        installmentList[0] = {
          ...installmentList[0],
          amount_to_be_paid: paymentData.amount.toString()
        };
      }
      if (
        data &&
        data.status_code === 100 &&
        Array.isArray(installmentList) &&
        installmentList.length > 0
      ) {
        setInstallments(installmentList);
        setSelectedInstallment(String(installmentList[0].installments_number));
        setFormData(prev => ({
          ...prev,
          amount: parseFloat(installmentList[0].amount_to_be_paid)
        }));
      } else {
        setInstallments([]);
        setSelectedInstallment('1');
        setFormData(prev => ({
          ...prev,
          amount: paymentData.amount
        }));
      }
    } catch (err) {
      setInstallments([]);
      setSelectedInstallment('1');
      setFormData(prev => ({
        ...prev,
        amount: paymentData.amount
      }));
    } finally {
      setIsLoadingInstallments(false);
    }
  };

  // Taksit seçimi değiştiğinde
  const handleInstallmentChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedCount = e.target.value;
    setSelectedInstallment(selectedCount);

    const selectedInstallmentData = installments.find(item => item.installments_number === parseInt(selectedCount));
    if (selectedInstallmentData) {
      setFormData(prev => ({
        ...prev,
        amount: parseFloat(selectedInstallmentData.amount_to_be_paid)
      }));
    }
  };

  const validateForm = () => {
    // Since form data is auto-filled, we just need to check if the data is available
    if (!formData.ad || !formData.soyad || !formData.email) {
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return false;
    }

    return true;
  };

  const validateCardForm = () => {
    if (!cardData.kart_numarasi || !cardData.kart_ismi || !cardData.son_kullanma_ay || !cardData.son_kullanma_yil || !cardData.cvv) {
      return false;
    }

    // Kart numarası kontrolü (16 haneli)
    if (cardData.kart_numarasi.replace(/\s/g, '').length !== 16) {
      return false;
    }

    // CVV kontrolü (3-4 haneli)
    if (cardData.cvv.length < 3 || cardData.cvv.length > 4) {
      return false;
    }

    return true;
  };

  const cleanupSipayElements = () => {
    if (formRef.current) {
      formRef.current.innerHTML = '';
    }

    // Sipay ile ilgili script ve elementleri temizle
    const sipayScripts = document.querySelectorAll('script[src*="sipay"], script[src*="payment"]');
    sipayScripts.forEach(script => script.remove());

    const sipayElements = document.querySelectorAll(
      'div[id*="sipay"], div[id*="payment"], form[id*="sipay"], form[id*="payment"]'
    );
    sipayElements.forEach(el => {
      if (el.parentNode) {
        el.innerHTML = '';
      }
    });
  };

  // Sipay payment mutation
  const sipayPaymentMutation = useMutation({
    mutationFn: async () => {
      console.log("💳 Sipay paySmart3D form gönderiliyor...");

      if (!paymentData) {
        throw new Error("Ödeme verisi bulunamadı");
      }

      // Unique invoice ID oluştur
      const invoiceId = `INV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Base URL'den callback URL'lerini oluştur
      const baseUrl = window.location.origin;
      const cancelUrl = `${baseUrl}/odeme-hatasi`;
      const returnUrl = `${baseUrl}/odeme-basarili`;

      const paySmart3DRequest = {
        cc_holder_name: cardData.kart_ismi,
        cc_no: cardData.kart_numarasi.replace(/\s/g, ''),
        expiry_month: cardData.son_kullanma_ay,
        expiry_year: cardData.son_kullanma_yil,
        cvv: cardData.cvv,
        currency_code: "TRY",
        installments_number: selectedInstallment,
        invoice_id: invoiceId,
        invoice_description: `${invoiceId} nolu bakiye yükleme ödemesi`,
        name: formData.ad,
        surname: formData.soyad,
        total: formData.amount,
        unit_price: formData.amount,
        quantity: 1,
        items: [{
          name: "Bakiye Yükleme",
          quantity: 1,
          price: formData.amount
        }],
        cancel_url: cancelUrl,
        return_url: returnUrl,
        bill_email: formData.email,
        bill_phone: formData.telefon,
        bill_address1: formData.adres,
        bill_city: formData.sehir,
        bill_postcode: formData.posta_kodu,
        bill_country: formData.ulke,
        payment_completed_by: 'app',
        response_method: 'POST',
        ip: window.location.hostname,
        token: paymentData.token,
        bayi_id: paymentData.bayi_id,
        yuklenecek_tutar: paymentData.amount,
      };

      console.log("📋 paySmart3D request data:", paySmart3DRequest);

      const dbPaymentData = {
        invoice_id: invoiceId,
        cc_holder_name: cardData.kart_ismi,
        cc_no: cardData.kart_numarasi.replace(/\s/g, ''),
        expiry_month: cardData.son_kullanma_ay,
        expiry_year: cardData.son_kullanma_yil,
        cvv: cardData.cvv,
        total: formData.amount,
        quantity: 1,
        name: formData.ad,
        surname: formData.soyad,
        currency_code: "TRY",
        installments_number: selectedInstallment,
        invoice_description: `${invoiceId} nolu bakiye yükleme ödemesi`,
        bill_email: formData.email,
        bill_phone: formData.telefon,
        bill_address1: formData.adres,
        bill_city: formData.sehir,
        bill_postcode: formData.posta_kodu,
        bill_country: formData.ulke,
        ip: window.location.hostname,
        status: 0,
        unit_price: formData.amount
      };

      await sipayApi.sipayDbPayment(paySmart3DRequest);

      const result = await sipayApi.paySmart3D(paySmart3DRequest);
      return result;
    },
    onSuccess: (data) => {
      console.log("✅ Sipay paySmart3D başarılı:", data);

      toast({
        title: "Yönlendiriliyor",
        description: "Ödeme sayfasına yönlendiriliyor...",
      });
    },
    onError: (error: any) => {
      console.error("💥 Sipay paySmart3D hatası:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Ödeme işlemi başlatılırken bir hata oluştu",
      });
    },
  });

  const handlePayment = async () => {
    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Müşteri bilgileri yüklenemedi. Lütfen sayfayı yenileyin.",
      });
      return;
    }

    if (!validateCardForm()) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen tüm kredi kartı bilgilerini doğru şekilde doldurun.",
      });
      return;
    }

    cleanupSipayElements();
    setFormKey(prevKey => prevKey + 1);
    setLoading(true);

    try {
      await sipayPaymentMutation.mutateAsync();
    } finally {
      setLoading(false);
    }
  };

  const handleBackToForm = () => {
    cleanupSipayElements();
    setShowPaymentForm(false);
  };

  const handleBackToBakiye = () => {
    // SessionStorage'ı temizle
    sessionStorage.removeItem('sipay_payment_data');
    setLocation('/bakiye');
  };

  // Component unmount cleanup
  useEffect(() => {
    return () => {
      cleanupSipayElements();
    };
  }, []);

  if (!paymentData) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToBakiye}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Geri Dön
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sipay Bakiye Yükleme</h1>
            <p className="text-muted-foreground">
              Güvenli ödeme ile bakiye yükleme
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
        {/* Sol taraf - Ödeme bilgileri + Müşteri bilgileri */}
        {!showPaymentForm && (
          <Card className="w-full lg:w-1/2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Ödeme Bilgileri
              </CardTitle>
              <CardDescription>
                Bakiye yükleme işlemi için ödeme bilgilerinizi girin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Ödeme Detayları */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">Ödeme Detayları</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Yüklenecek Tutar:</span>
                      <span className="font-semibold">{paymentData.amount.toLocaleString('tr-TR')} ₺</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bayi:</span>
                      <span className="font-semibold">
                        {bayiLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin inline" />
                        ) : bayiData?.data?.ad ? (
                          bayiData.data.ad
                        ) : (
                          `Bayi ID: ${paymentData.bayi_id}`
                        )}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        )}

        {/* Sağ taraf - Kredi Kartı Bilgileri */}
        {!showPaymentForm && (
          <Card className="w-full lg:w-1/2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Kredi Kartı Bilgileri
              </CardTitle>
              <CardDescription>
                Güvenli ödeme için kredi kartı bilgilerinizi girin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="kart_numarasi">Kart Numarası <span className="text-red-500">*</span></Label>
                  <Input
                    id="kart_numarasi"
                    name="kart_numarasi"
                    placeholder="1234 5678 9012 3456"
                    value={cardData.kart_numarasi}
                    onChange={handleCardChange}
                    maxLength={19}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kart_ismi">Kart Üzerindeki İsim <span className="text-red-500">*</span></Label>
                  <Input
                    id="kart_ismi"
                    name="kart_ismi"
                    placeholder="Kart üzerindeki isim"
                    value={cardData.kart_ismi}
                    onChange={handleCardChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="son_kullanma_ay">Son Kullanma Ay <span className="text-red-500">*</span></Label>
                    <select
                      id="son_kullanma_ay"
                      name="son_kullanma_ay"
                      value={cardData.son_kullanma_ay}
                      onChange={handleCardChange}
                      className="w-full border rounded-md p-3 outline-none focus:border-blue-500"
                      required
                    >
                      <option value="">MM</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month.toString().padStart(2, '0')}>
                          {month.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="son_kullanma_yil">Son Kullanma Yıl <span className="text-red-500">*</span></Label>
                    <select
                      id="son_kullanma_yil"
                      name="son_kullanma_yil"
                      value={cardData.son_kullanma_yil}
                      onChange={handleCardChange}
                      className="w-full border rounded-md p-3 outline-none focus:border-blue-500"
                      required
                    >
                      <option value="">YY</option>
                      {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                        <option key={year} value={year.toString().slice(-2)}>
                          {year.toString().slice(-2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV <span className="text-red-500">*</span></Label>
                    <Input
                      id="cvv"
                      name="cvv"
                      placeholder="123"
                      value={cardData.cvv}
                      onChange={handleCardChange}
                      maxLength={4}
                      required
                    />
                  </div>
                </div>

                {/* TAKSİT SEÇENEKLERİ */}
                {isLoadingInstallments ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="animate-spin text-primary-600 w-6 h-6" />
                    <span className="ml-2">Taksit seçenekleri yükleniyor...</span>
                  </div>
                ) : installments.length > 0 ? (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Taksit Seçenekleri</h3>
                    <div className="flex flex-col gap-2">
                      {installments.map((item: any) => {
                        const count = item.installments_number;
                        const total = parseFloat(item.amount_to_be_paid);
                        const label = count === 1 ? 'Tek Çekim' : `${count} Taksit`;
                        const isSelected = selectedInstallment === String(count);
                        const formatTL = (val: number) => val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
                        return (
                          <label
                            key={count}
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-blue-400'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="installment"
                                value={count}
                                checked={isSelected}
                                onChange={handleInstallmentChange}
                                className="accent-blue-600 w-5 h-5"
                              />
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900">{label}</span>
                                {item.card_program && (
                                  <span className="text-xs text-gray-500">{item.card_program} - {item.card_scheme?.toUpperCase()}</span>
                                )}
                                {item.card_bank && (
                                  <span className="text-xs text-gray-500">{item.card_bank}</span>
                                )}
                              </div>
                            </div>
                            <div className="font-semibold text-gray-900 text-base min-w-[120px] text-right">
                              {formatTL(total)}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                {/* TOPLAM TUTAR */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Toplam Tutar:</span>
                    <span>
                      {isLoadingInstallments ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="animate-spin text-primary-600 w-5 h-5" />
                          <span>Hesaplanıyor...</span>
                        </div>
                      ) : (
                        formData?.amount > 0 ? `${formData?.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL` 
                        : `${paymentData?.amount?.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`
                      )}
                    </span>
                  </div>
                  {selectedInstallment !== '1' && !isLoadingInstallments && (
                    <div className="text-sm text-gray-600 mt-1">
                      {selectedInstallment} taksit x {(formData.amount / parseInt(selectedInstallment)).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                    </div>
                  )}
                </div>
                <Button
                  onClick={handlePayment}
                  className="w-full mt-6"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      İşleminiz Yapılıyor...
                    </>
                  ) : (
                    "Ödemeyi Tamamla"
                  )}
                </Button>

                {paymentResult && paymentResult.status === "error" && (
                  <div className="mt-4 text-red-600 bg-red-50 p-3 rounded border border-red-200">
                    {paymentResult.errorMessage}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Form Container */}
        {showPaymentForm && (
          <div className="w-full">
            <div className="mb-6">
              <Button
                variant="outline"
                onClick={handleBackToForm}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Bilgileri Değiştir
              </Button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default SipayBakiyeEkrani; 