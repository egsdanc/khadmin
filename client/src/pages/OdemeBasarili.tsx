import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

interface BakiyeIslemi {
  id: number;
  bayi_id: number;
  miktar: number;
  bakiye_sonrasi: number;
  aciklama?: string;
  invoice_id?: string;
  created_at: string;
  updated_at: string;
  status: number;
  manuel_yukleme: number;
  iyzico_yukleme: number;
  sipay_yukleme: number;
}

function OdemeBasarili() {
  const [, setLocation] = useLocation();
  const [searchParams, setSearchParams] = useState<URLSearchParams>(new URLSearchParams(window.location.search));
  const [bakiyeIslemi, setBakiyeIslemi] = useState<BakiyeIslemi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearchParams(params);
    
    const invoice_id = params.get("invoice_id");
    const status = params.get("status");
    
    console.log('Payment success data:', { invoice_id, status });

    if (!invoice_id) {
      setError("Fatura ID bulunamadı");
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Fetch bakiye islemi data from API
    const fetchBakiyeIslemi = async () => {
      try {
        const response = await fetch(`/api/bakiye/islem/${invoice_id}`);
        
        if (!response.ok) {
          throw new Error('Bakiye işlemi bulunamadı');
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
          setBakiyeIslemi(data.data);
        } else {
          throw new Error(data.message || 'Bakiye işlemi bulunamadı');
        }
      } catch (err: any) {
        console.error('Error fetching bakiye islemi:', err);
        setError(err.message || 'Bakiye işlemi yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchBakiyeIslemi();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentType = (islemi: BakiyeIslemi) => {
    if (islemi.sipay_yukleme > 0) return "Sipay Bakiye Yükleme";
    if (islemi.iyzico_yukleme > 0) return "iyzico Bakiye Yükleme";
    if (islemi.manuel_yukleme > 0) return "Manuel Bakiye Yükleme";
    return "Bakiye İşlemi";
  };

  const invoice_id = searchParams.get("invoice_id");

  return (
    <div style={{ minHeight: "100vh", background: "#eaf0fa", padding: "20px" }}>
      <div
        style={{
          maxWidth: 900,
          margin: "20px auto",
          background: "#fff",
          borderRadius: 24,
          boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Sol taraf */}
        <div style={{ padding: "20px", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ marginBottom: 16 }}>
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="56" height="56" rx="16" fill="#E6F4EA" />
                <path d="M28 16L36 24H32V36H24V24H20L28 16Z" fill="#34A853" />
              </svg>
            </div>
            <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 8 }}>Bakiye Yükleme Başarılı</h2>
            <div style={{ color: "#888", fontSize: 16 }}>Bakiyeniz başarıyla yüklendi.</div>
            {bakiyeIslemi && (
              <div style={{ fontSize: 32, fontWeight: 600, margin: "24px 0 0 0", color: "#222" }}>
                {formatCurrency(bakiyeIslemi.miktar)}
              </div>
            )}
          </div>
          <div style={{ background: "#f7fafd", borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 12 }}>İşlem Detayları</div>
            {loading && <div>Yükleniyor...</div>}
            {error && <div style={{ color: "red" }}>{error}</div>}
            {bakiyeIslemi && (
              <table style={{ width: "100%", fontSize: 15 }}>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 500, padding: "6px 0" }}>Fatura No</td>
                    <td>{bakiyeIslemi.invoice_id || invoice_id}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 500, padding: "6px 0" }}>İşlem Türü</td>
                    <td>{getPaymentType(bakiyeIslemi)}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 500, padding: "6px 0" }}>Yüklenen Tutar</td>
                    <td style={{ color: "#34A853", fontWeight: 600 }}>{formatCurrency(bakiyeIslemi.miktar)}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 500, padding: "6px 0" }}>Yeni Bakiye</td>
                    <td style={{ color: "#222", fontWeight: 600 }}>{formatCurrency(bakiyeIslemi.bakiye_sonrasi)}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 500, padding: "6px 0" }}>İşlem Tarihi</td>
                    <td>{formatDate(bakiyeIslemi.updated_at)}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 500, padding: "6px 0" }}>Durum</td>
                    <td style={{ color: "#34A853", fontWeight: 600 }}>Başarılı</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
          <button 
            onClick={() => setLocation('/panel')}
            style={{ 
              display: "block", 
              width: "100%", 
              textAlign: "center", 
              background: "#34A853", 
              color: "#fff", 
              borderRadius: 8, 
              padding: "14px 0", 
              fontWeight: 600, 
              fontSize: 18, 
              border: "none",
              cursor: "pointer"
            }}
          >
            Ana Sayfaya Dön
          </button>
        </div>
        {/* Sağ taraf */}
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ marginBottom: 16 }}>
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="56" height="56" rx="16" fill="#E6F4EA" />
                <path d="M16 28H40V32C40 34.2091 38.2091 36 36 36H20C17.7909 36 16 34.2091 16 32V28Z" fill="#34A853" />
                <rect x="20" y="20" width="16" height="8" rx="4" fill="#34A853" />
              </svg>
            </div>
            <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 12, color: '#222' }}>Teşekkürler!</div>
            <div style={{ color: "#555", fontSize: 16, marginBottom: 16 }}>
              Bakiye yükleme işleminiz başarıyla tamamlanmıştır.<br />
              Bakiyeniz hesabınıza anında yansıtılmıştır.<br />
              Güvenilir ödeme altyapımızı tercih ettiğiniz için teşekkür ederiz.<br />
              Sorularınız için <a href="mailto:kilometrehacker@gmail.com" style={{ color: '#34A853', textDecoration: 'underline' }}>iletişim</a> sayfamızdan bize ulaşabilirsiniz.
            </div>
            <div style={{ marginTop: 32, color: "#34A853", fontWeight: 700, fontSize: 18 }}>kilometre<span style={{ fontWeight: 400, fontSize: 14, marginLeft: 4 }}>HACKER</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OdemeBasarili;