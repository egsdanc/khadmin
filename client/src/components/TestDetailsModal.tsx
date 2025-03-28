import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { jsPDF } from "jspdf";

interface Test {
  id: number;
  test_id: number;
  tarih: string;
  plaka: string;
  sase: string;
  motor: string;
  marka: string;
  model: string;
  kontrolmod: string;
  gosterge_km: number;
  km: string;
  ucret: string;
  aciklama?: string;
}

interface ApiResponse {
  success: boolean;
  data: Test[];
}

interface TestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  testId: number | null;
}

export function TestDetailsModal({ isOpen, onClose, testId }: TestDetailsModalProps) {
  const { data: response, isLoading } = useQuery<ApiResponse>({
    queryKey: [`/api/testler/${testId}`],
    enabled: isOpen && !!testId,
  });

  const tests = response?.data || [];
  const firstTest = tests[0];

  if (!isOpen || !testId) return null;

  const generatePDF = () => {
    if (!firstTest || !tests) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // Ana Başlık
    doc.setFontSize(20);
    doc.text("KILOMETRE HACKER", doc.internal.pageSize.width / 2, 40, { align: "center" });
    doc.setFontSize(14);
    doc.text("Test Raporu", doc.internal.pageSize.width / 2, 50, { align: "center" });

    // Tarih ve Lokasyon
    const testDate = new Date(firstTest.tarih).toLocaleDateString('tr-TR');
    doc.setFontSize(10);
    doc.text(`Tarih: ${testDate}`, 20, 65);
    doc.text("Ankara / Yenimahalle", doc.internal.pageSize.width - 20, 65, { align: "right" });

    // Gri kart için arka plan
    doc.setFillColor(245, 245, 245);
    doc.rect(20, 75, doc.internal.pageSize.width - 40, 50, 'F');

    // Araç Bilgileri - Sol Kolon
    doc.setFontSize(10);
    doc.text("Plaka", 25, 85);
    doc.text(firstTest.plaka, 25, 90);

    doc.text("Sase No", 25, 100);
    doc.text(firstTest.sase, 25, 105);

    doc.text("Kontrol Modu", 25, 115);
    doc.text(firstTest.kontrolmod, 25, 120);

    // Araç Bilgileri - Sağ Kolon
    const rightColX = doc.internal.pageSize.width - 75;
    doc.text("Marka/Model", rightColX, 85);
    doc.text(`${firstTest.marka} ${firstTest.model}`, rightColX, 90);

    doc.text("Motor No", rightColX, 100);
    doc.text(firstTest.motor, rightColX, 105);

    doc.text("Gösterge KM", rightColX, 115);
    doc.text(firstTest.gosterge_km.toString(), rightColX, 120);

    // Modül Detayları Başlığı
    doc.setFontSize(12);
    doc.text("Modul Detaylari", 20, 145);

    // Tablo başlıkları için arka plan
    doc.setFillColor(240, 240, 240);
    doc.rect(20, 150, doc.internal.pageSize.width - 40, 8, 'F');

    // Tablo başlıkları
    doc.setFontSize(10);
    doc.text("Modul", 25, 155);
    doc.text("Kilometre", rightColX, 155);

    // Tablo çizgileri
    let yPos = 150;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, doc.internal.pageSize.width - 20, yPos);

    // Modül Detayları Tablosu
    yPos = 158;
    const lineHeight = 8;

    tests.forEach((test) => {
      if (yPos > doc.internal.pageSize.height - 30) {
        doc.addPage();
        yPos = 20;
      }

      doc.text(test.kontrolmod, 25, yPos + 5);
      doc.text(test.km, rightColX, yPos + 5);

      yPos += lineHeight;
      doc.line(20, yPos, doc.internal.pageSize.width - 20, yPos);
    });

    // Test Ücreti
    doc.setFontSize(10);
    doc.text(`Test Ucreti: ${firstTest.ucret} TL`, doc.internal.pageSize.width - 40, yPos + 10, { align: "right" });

    // Footer - Yasal Uyarı
    doc.setFontSize(8);
    doc.text(
      "Kilometre verileri, aracin beyinlerinden ve sensorlerinden alinan anlik verilerdir. Detayli bilgi icin e-Devlet veya TRAMER uzerinden sorgulama yapabilirsiniz.",
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: "center", maxWidth: 170 }
    );

    // PDF'i indir
    doc.save(`kilometre-hacker-${firstTest.plaka}-${testDate}.pdf`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Test Detayları</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : firstTest ? (
          <div className="mt-4 space-y-6">
            <Card className="bg-white">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Araç Bilgileri</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Plaka</p>
                    <p className="mt-1">{firstTest.plaka}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Şase No</p>
                    <p className="mt-1">{firstTest.sase}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Motor No</p>
                    <p className="mt-1">{firstTest.motor}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Marka/Model</p>
                    <p className="mt-1">{firstTest.marka} {firstTest.model}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Gösterge KM</p>
                    <p className="mt-1">{firstTest.gosterge_km}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ücret</p>
                    <p className="mt-1">{firstTest.ucret} TL</p>
                  </div>
                  {firstTest.aciklama && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Açıklama</p>
                      <p className="mt-1">{firstTest.aciklama}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Modül Detayları</h3>
                <Button variant="outline" size="sm" onClick={generatePDF}>
                  PDF İndir
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-4 text-left font-medium text-sm">Modül</th>
                        <th className="py-3 px-4 text-right font-medium text-sm">Kilometre</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tests.map((test, index) => (
                        <tr key={index} className="border-b last:border-0">
                          <td className="py-3 px-4">{test.kontrolmod}</td>
                          <td className="py-3 px-4 text-right">{test.km}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            Test detayları yüklenemedi
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}