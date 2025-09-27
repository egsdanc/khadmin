import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { jsPDF } from "jspdf";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface VINTest {
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
  vin1: string;
  vin2: string;
  vin3: string;
  usersid: number;
  tarih: string;
  test_id: number;
  kullanici_adi: string;
  bayi_adi: string;
  firma_adi: string;
}

interface ApiResponse {
  success: boolean;
  data: VINTest[];
}

interface VINDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  testId: number | null;
}

export function VINDetailsModal({ isOpen, onClose, testId }: VINDetailsModalProps) {
  const { t } = useLanguage();
  const { data: response, isLoading } = useQuery<ApiResponse>({
    queryKey: [`/api/vinreader/${testId}`],
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
    doc.text(t('vin-hacker').toUpperCase(), doc.internal.pageSize.width / 2, 30, { align: "center" });

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
    const modulColWidth = 60; // Modul sütunu için genişlik
    const vinColWidth = 55;    // VIN sütunları için genişlik
    const modulStart = margin + 5;
    const vin1Start = modulStart + modulColWidth;
    const vin2Start = vin1Start + vinColWidth;
    const vin3Start = vin2Start + vinColWidth;

    // Başlıklar
    doc.setFont("helvetica", "bold");
    addText(t('module'), modulStart, tableTop + 10);
    addText("VIN1", vin1Start, tableTop + 10);
    addText("VIN2", vin2Start, tableTop + 10);
    addText("VIN3", vin3Start, tableTop + 10);

    // Veriler
    let currentY = tableTop + rowHeight;
    doc.setFont("helvetica", "normal");

    tests.forEach((test) => {
      if (currentY > doc.internal.pageSize.height - 20) {
        doc.addPage();
        currentY = 20;
      }

      // Modul ismini çok satırlı olarak göster
      const modulText = test.kontrolmod || '';
      const modulMaxWidth = modulColWidth - 5; // Sütun genişliği - padding
      
      // jsPDF'in splitTextToSize fonksiyonunu kullanarak metni böl
      const splitModul = doc.splitTextToSize(modulText, modulMaxWidth);
      const lineHeight = 4; // Satır arası yükseklik
      
      // Modul ismini çok satırlı olarak yaz
      splitModul.forEach((line: string, index: number) => {
        addText(line, modulStart, currentY + 10 + (index * lineHeight));
      });
      
      // VIN değerlerini de çok satırlı olarak göster
      const vin1Text = test.vin1 || '';
      const vin2Text = test.vin2 || '';
      const vin3Text = test.vin3 || '';
      const vinMaxWidth = vinColWidth - 5; // Sütun genişliği - padding
      
      const splitVin1 = doc.splitTextToSize(vin1Text, vinMaxWidth);
      const splitVin2 = doc.splitTextToSize(vin2Text, vinMaxWidth);
      const splitVin3 = doc.splitTextToSize(vin3Text, vinMaxWidth);
      
      // VIN değerlerini çok satırlı olarak yaz
      splitVin1.forEach((line: string, index: number) => {
        addText(line, vin1Start, currentY + 10 + (index * lineHeight));
      });
      splitVin2.forEach((line: string, index: number) => {
        addText(line, vin2Start, currentY + 10 + (index * lineHeight));
      });
      splitVin3.forEach((line: string, index: number) => {
        addText(line, vin3Start, currentY + 10 + (index * lineHeight));
      });

      // Satır yüksekliğini en uzun çok satırlı metne göre ayarla
      const modulHeight = splitModul.length * lineHeight;
      const vin1Height = splitVin1.length * lineHeight;
      const vin2Height = splitVin2.length * lineHeight;
      const vin3Height = splitVin3.length * lineHeight;
      const maxTextHeight = Math.max(modulHeight, vin1Height, vin2Height, vin3Height, 8);
      currentY += Math.max(rowHeight, maxTextHeight + 2);
    });

    doc.save(`vin-hacker-${firstTest.plaka}-${formatDate(firstTest.tarih)}.pdf`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('vin-hacker')} {t('details')}</DialogTitle>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4"> {/* Changed to lg:grid-cols-2 */}
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
                    <div className="col-span-full">
                      <p className="text-sm font-medium text-muted-foreground">{t('description')}</p>
                      <p className="mt-1">{firstTest.aciklama}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                <h3 className="text-lg font-semibold">{t('vin-hacker')} {t('details')}</h3>
                <Button variant="outline" onClick={generatePDF}>
                  {t('download-pdf')}
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px] whitespace-nowrap">VIN1</TableHead>
                      <TableHead className="w-[200px] whitespace-nowrap">VIN2</TableHead>
                      <TableHead className="w-[200px] whitespace-nowrap">VIN3</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tests.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell className="font-mono whitespace-nowrap">{test.vin1 || '-'}</TableCell>
                        <TableCell className="font-mono whitespace-nowrap">{test.vin2 || '-'}</TableCell>
                        <TableCell className="font-mono whitespace-nowrap">{test.vin3 || '-'}</TableCell>
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