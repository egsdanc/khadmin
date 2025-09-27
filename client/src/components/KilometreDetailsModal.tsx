import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { jsPDF } from "jspdf";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface KilometreTest {
  id: number;
  plaka: string;
  sase: string;
  motor: string;
  marka: string;
  model: string;
  yil: number;
  gosterge_km: number;
  paket: string;
  ucret: string;
  aciklama: string;
  kontrolmod: string;
  km: string;
  usersid: number;
  tarih: string;
  test_id: number;
  firma_adi: string;
  bayi_adi: string;
  kullanici_adi: string;
}

interface ApiResponse {
  success: boolean;
  data: KilometreTest[];
}

interface KilometreDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  testId: number | null;
}

export function KilometreDetailsModal({ isOpen, onClose, testId }: KilometreDetailsModalProps) {
  const { t } = useLanguage();
  const { data: response, isLoading } = useQuery<ApiResponse>({
    queryKey: [`/api/kilometre/${testId}`],
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
      format: "a4",
      putOnlyUsedFonts: true,
      floatPrecision: 16
    });

    // Set font for Turkish characters
    doc.setFont("helvetica", "normal");
    doc.setLanguage("tr");

    // Başlık
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text(t('kilometre-hacker').toUpperCase(), doc.internal.pageSize.width / 2, 30, { align: "center" });

    // Alt Başlık
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text(t('test-report'), doc.internal.pageSize.width / 2, 45, { align: "center" });

    // Tarih
    doc.setFontSize(10);
    doc.text(`${t('test-date')}: ${formatDate(firstTest.tarih)}`, 20, 60);

    // Firma ve Bayi Bilgileri
    const addText = (text: string, x: number, y: number) => {
      // Convert Turkish characters to their ASCII equivalents
      const cleanText = text.toString()
        .replace(/ğ/g, 'g')
        .replace(/Ğ/g, 'G')
        .replace(/ü/g, 'u')
        .replace(/Ü/g, 'U')
        .replace(/ş/g, 's')
        .replace(/Ş/g, 'S')
        .replace(/ı/g, 'i')
        .replace(/İ/g, 'I')
        .replace(/ö/g, 'o')
        .replace(/Ö/g, 'O')
        .replace(/ç/g, 'c')
        .replace(/Ç/g, 'C');
      doc.text(cleanText, x, y);
    };

    // Firma ve Bayi Bilgileri
    addText(t('company'), doc.internal.pageSize.width - 140, 60);
    addText(firstTest.firma_adi || '-', doc.internal.pageSize.width - 140, 65);

    addText(t('dealer'), doc.internal.pageSize.width - 80, 60);
    addText(firstTest.bayi_adi || '-', doc.internal.pageSize.width - 80, 65);

    // Araç Bilgileri Kartı
    doc.setFillColor(245, 245, 245);
    doc.rect(20, 75, doc.internal.pageSize.width - 40, 50, 'F');

    // Araç Bilgileri
    addText(t('plate'), 30, 85);
    addText(firstTest.plaka || '', 30, 90);

    addText(t('chassis-number'), 30, 100);
    addText(firstTest.sase || '', 30, 105);

    addText(t('engine-number'), 30, 115);
    addText(firstTest.motor || '', 30, 120);

    const rightCol = doc.internal.pageSize.width - 80;
    addText(t('brand-model'), rightCol, 85);
    addText(`${firstTest.marka || ''} ${firstTest.model || ''}`, rightCol, 90);

    addText(t('model-year'), rightCol, 100);
    addText(firstTest.yil?.toString() || '', rightCol, 105);

    addText(t('kilometre'), rightCol, 115);
    addText(firstTest.gosterge_km?.toString() || '', rightCol, 120);

    // Tablo başlangıç pozisyonu
    const tableTop = 135;
    const rowHeight = 18; // Satır yüksekliğini artırdık
    const margin = 20;
    const tableWidth = doc.internal.pageSize.width - (margin * 2);

    // Başlık satırı arka planı
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, tableTop, tableWidth, rowHeight, 'F');

    // Sütun genişlikleri - sayfa genişliğine göre ayarla
    const testTipiColWidth = 120; // Test Tipi sütunu için genişlik
    const kilometreColWidth = 60;  // Kilometre sütunu için genişlik
    const testTipiStart = margin + 5;
    const kilometreStart = testTipiStart + testTipiColWidth;

    // Başlıklar
    doc.setFont("helvetica", "bold");
    addText(t('module'), testTipiStart, tableTop + 10);
    addText(t('kilometre'), kilometreStart, tableTop + 10);

    // Veriler
    let currentY = tableTop + rowHeight;
    doc.setFont("helvetica", "normal");

    tests.forEach((test) => {
      if (currentY > doc.internal.pageSize.height - 20) {
        doc.addPage();
        currentY = 20;
      }

      // Test tipi ismini çok satırlı olarak göster
      const testTipiText = test.kontrolmod || '';
      const testTipiMaxWidth = testTipiColWidth - 5; // Sütun genişliği - padding
      
      // jsPDF'in splitTextToSize fonksiyonunu kullanarak metni böl
      const splitTestTipi = doc.splitTextToSize(testTipiText, testTipiMaxWidth);
      const lineHeight = 4; // Satır arası yükseklik
      
      // Test tipi ismini çok satırlı olarak yaz
      splitTestTipi.forEach((line: string, index: number) => {
        addText(line, testTipiStart, currentY + 10 + (index * lineHeight));
      });
      
      // Kilometre değerini de çok satırlı olarak göster
      const kilometreText = test.km || '';
      const kilometreMaxWidth = kilometreColWidth - 5; // Sütun genişliği - padding
      const splitKilometre = doc.splitTextToSize(kilometreText, kilometreMaxWidth);
      
      // Kilometre değerini çok satırlı olarak yaz
      splitKilometre.forEach((line: string, index: number) => {
        addText(line, kilometreStart, currentY + 10 + (index * lineHeight));
      });

      // Satır yüksekliğini en uzun çok satırlı metne göre ayarla
      const testTipiHeight = splitTestTipi.length * lineHeight;
      const kilometreHeight = splitKilometre.length * lineHeight;
      const maxTextHeight = Math.max(testTipiHeight, kilometreHeight, 8);
      currentY += Math.max(rowHeight, maxTextHeight + 2);
    });

    doc.save(`kilometre-hacker-${firstTest.plaka}-${formatDate(firstTest.tarih)}.pdf`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kilometre Detayları</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : firstTest ? (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">{t('vehicle-information')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('test-date')}</p>
                    <p className="mt-1">{formatDate(firstTest.tarih)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('plate')}</p>
                    <p className="mt-1">{firstTest.plaka}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('chassis-number')}</p>
                    <p className="mt-1">{firstTest.sase}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('engine-number')}</p>
                    <p className="mt-1">{firstTest.motor}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('brand-model')}</p>
                    <p className="mt-1">{firstTest.marka} {firstTest.model}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('model-year')}</p>
                    <p className="mt-1">{firstTest.yil}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('odometer-km')}</p>
                    <p className="mt-1">{firstTest.gosterge_km}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('fee')}</p>
                    <p className="mt-1">{firstTest.ucret}</p>
                  </div>
                  {firstTest.aciklama && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">{t('description')}</p>
                      <p className="mt-1">{firstTest.aciklama}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                <h3 className="text-lg font-semibold">{t('test-details')}</h3>
                <Button variant="outline" onClick={generatePDF}>
                  {t('download-pdf')}
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px] whitespace-nowrap">{t('test-type')}</TableHead>
                      <TableHead className="w-[100px] text-right whitespace-nowrap">{t('kilometre')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tests.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell className="whitespace-nowrap">{test.kontrolmod}</TableCell>
                        <TableCell className="text-right font-mono whitespace-nowrap">{test.km}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            {t('test-details-could-not-be-loaded')}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}