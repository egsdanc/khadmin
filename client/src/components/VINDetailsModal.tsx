import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { jsPDF } from "jspdf";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/use-auth";

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
  const { user } = useAuth();

  const { data: response, isLoading } = useQuery<ApiResponse>({
    queryKey: ["/api/vinreader/", testId],
    queryFn: async () => {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const params = new URLSearchParams();
      params.append('user', JSON.stringify(user));
      
      const response = await fetch(`/api/vinreader/${testId}?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
    enabled: isOpen && !!testId && !!user,
  });

  const tests = response?.data || [];
  const firstTest = tests[0];

  if (!isOpen || !testId) return null;

  const generatePDF = () => {
    if (!firstTest || !tests?.length) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      putOnlyUsedFonts: true,
      floatPrecision: 16,
    });

    // Safe access for width/height across jsPDF versions
    const pageWidth = (doc as any).internal?.pageSize?.getWidth
      ? (doc as any).internal.pageSize.getWidth()
      : (doc as any).internal.pageSize.width;
    const pageHeight = (doc as any).internal?.pageSize?.getHeight
      ? (doc as any).internal.pageSize.getHeight()
      : (doc as any).internal.pageSize.height;

    // Fonts
    doc.setFont("helvetica", "normal");

    // Başlık
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text(t("vin-hacker").toUpperCase(), pageWidth / 2, 30, { align: "center" });

    // Alt Başlık
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text(t("test-report"), pageWidth / 2, 45, { align: "center" });

    // Tarih
    doc.setFontSize(10);
    doc.text(`${t("test-date")}: ${formatDate(firstTest.tarih)}`, 20, 60);

    // Türkçe karakterleri sadeleştiren yardımcı
    const addText = (text: string, x: number, y: number) => {
      const cleanText = text
        .toString()
        .replace(/ğ/g, "g")
        .replace(/Ğ/g, "G")
        .replace(/ü/g, "u")
        .replace(/Ü/g, "U")
        .replace(/ş/g, "s")
        .replace(/Ş/g, "S")
        .replace(/ı/g, "i")
        .replace(/İ/g, "I")
        .replace(/ö/g, "o")
        .replace(/Ö/g, "O")
        .replace(/ç/g, "c")
        .replace(/Ç/g, "C");
      doc.text(cleanText, x, y);
    };

    // Firma ve Bayi Bilgileri
    addText(t("company"), pageWidth - 140, 60);
    addText(firstTest.firma_adi || "-", pageWidth - 140, 65);

    addText(t("dealer"), pageWidth - 80, 60);
    addText(firstTest.bayi_adi || "-", pageWidth - 80, 65);

    // Araç Bilgileri Kartı
    doc.setFillColor(245, 245, 245);
    doc.rect(20, 75, pageWidth - 40, 50, "F");

    // Araç Bilgileri
    addText(t("plate"), 30, 85);
    addText(firstTest.plaka || "", 30, 90);

    addText(t("chassis-number"), 30, 100);
    addText(firstTest.sase || "", 30, 105);

    addText(t("engine-number"), 30, 115);
    addText(firstTest.motor || "", 30, 120);

    const rightCol = pageWidth - 80;
    addText(t("brand-model"), rightCol, 85);
    addText(`${firstTest.marka || ""} ${firstTest.model || ""}`, rightCol, 90);

    addText(t("model-year"), rightCol, 100);
    addText(firstTest.yil?.toString() || "", rightCol, 105);

    addText(t("kilometre"), rightCol, 115);
    addText(firstTest.gosterge_km?.toString() || "", rightCol, 120);

    // === TABLO (her zaman sayfaya sığacak dinamik kolonlar) ===
    const tableTop = 135;
    const margin = 20;
    const tableLeft = margin;
    const tableRight = pageWidth - margin;
    const tableWidth = tableRight - tableLeft;

    const headerHeight = 12;
    const rowMinHeight = 10;
    const padX = 3;     // hücre yatay padding
    const padY = 4;     // hücre dikey padding
    const lineHeight = 4; // metin satır aralığı

    // Başlık arka planı
    doc.setFillColor(240, 240, 240);
    doc.rect(tableLeft, tableTop, tableWidth, headerHeight, "F");

    // Tablo fontunu biraz küçült (VIN'ler sığsın)
    doc.setFontSize(9);

    // --- Dinamik kolon genişlikleri ---
    // modul kolonu: tablonun ~%28'i, [42, 60] aralığında
    let modulColWidth = Math.min(60, Math.max(42, Math.floor(tableWidth * 0.28)));
    // kalan alan VIN kolonlarına eşit bölünsün
    let vinColWidth = Math.floor((tableWidth - modulColWidth) / 3);

    // Yuvarlama artığı son kolona eklensin ki sağ sınır tam otursun
    const leftover = tableWidth - modulColWidth - vinColWidth * 3;
    const vin1ColWidth = vinColWidth;
    const vin2ColWidth = vinColWidth;
    const vin3ColWidth = vinColWidth + leftover;

    // Kolon başlangıç X'leri (iç padding ile)
    const modulX = tableLeft + padX;
    const vin1X = modulX + modulColWidth + padX;
    const vin2X = vin1X + vin1ColWidth;
    const vin3X = vin2X + vin2ColWidth;

    // Başlıklar
    doc.setFont("helvetica", "bold");
    addText(t("module"), modulX, tableTop + 8);
    addText("VIN1", vin1X, tableTop + 8);
    addText("VIN2", vin2X, tableTop + 8);
    addText("VIN3", vin3X, tableTop + 8);

    // Satırlar
    let y = tableTop + headerHeight;
    doc.setFont("helvetica", "normal");

    const newPageWithHeader = () => {
      doc.addPage();
      y = 20;
      // yeni sayfada başlık şeridi
      doc.setFillColor(240, 240, 240);
      doc.rect(tableLeft, y, tableWidth, headerHeight, "F");
      doc.setFont("helvetica", "bold");
      addText(t("module"), modulX, y + 8);
      addText("VIN1", vin1X, y + 8);
      addText("VIN2", vin2X, y + 8);
      addText("VIN3", vin3X, y + 8);
      y += headerHeight;
      doc.setFont("helvetica", "normal");
    };

    tests.forEach((test) => {
      if (y > pageHeight - 20) newPageWithHeader();

      const modulText = test.kontrolmod || "";
      const vin1Text = test.vin1 || "";
      const vin2Text = test.vin2 || "";
      const vin3Text = test.vin3 || "";

      // İçerik genişlikleri (her hücrenin iç kısmı)
      const modulInnerW = modulColWidth - padX * 2;
      const vin1InnerW = vin1ColWidth - padX * 2;
      const vin2InnerW = vin2ColWidth - padX * 2;
      const vin3InnerW = vin3ColWidth - padX * 2;

      const mLines = doc.splitTextToSize(modulText, modulInnerW);
      const v1Lines = doc.splitTextToSize(vin1Text, vin1InnerW);
      const v2Lines = doc.splitTextToSize(vin2Text, vin2InnerW);
      const v3Lines = doc.splitTextToSize(vin3Text, vin3InnerW);

      // Hücrelere yaz
      mLines.forEach((line: string, i: number) => addText(line, modulX, y + padY + i * lineHeight));
      v1Lines.forEach((line: string, i: number) => addText(line, vin1X, y + padY + i * lineHeight));
      v2Lines.forEach((line: string, i: number) => addText(line, vin2X, y + padY + i * lineHeight));
      v3Lines.forEach((line: string, i: number) => addText(line, vin3X, y + padY + i * lineHeight));

      // Satır yüksekliği: en uzun hücreye göre + padding
      const contentHeights = [
        mLines.length * lineHeight,
        v1Lines.length * lineHeight,
        v2Lines.length * lineHeight,
        v3Lines.length * lineHeight,
      ];
      const rowHeight = Math.max(rowMinHeight, Math.max(...contentHeights) + padY + 2);

      y += rowHeight;
    });

    doc.save(`vin-hacker-${firstTest.plaka}-${formatDate(firstTest.tarih)}.pdf`);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("vin-hacker")} {t("details")}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : firstTest ? (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">{t("vehicle-information")}</h3>
                {/* grid columns adjusted to lg:2 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t("test-date")}</p>
                    <p className="mt-1">{formatDate(firstTest.tarih)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t("plate")}</p>
                    <p className="mt-1">{firstTest.plaka}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t("chassis-number")}</p>
                    <p className="mt-1">{firstTest.sase}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t("engine-number")}</p>
                    <p className="mt-1">{firstTest.motor}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t("brand-model")}</p>
                    <p className="mt-1">{firstTest.marka} {firstTest.model}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t("model-year")}</p>
                    <p className="mt-1">{firstTest.yil}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t("odometer-km")}</p>
                    <p className="mt-1">{firstTest.gosterge_km}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t("fee")}</p>
                    <p className="mt-1">{firstTest.ucret}</p>
                  </div>
                  {firstTest.aciklama && (
                    <div className="col-span-full">
                      <p className="text-sm font-medium text-muted-foreground">{t("description")}</p>
                      <p className="mt-1">{firstTest.aciklama}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                <h3 className="text-lg font-semibold">
                  {t("vin-hacker")} {t("details")}
                </h3>
                <Button variant="outline" onClick={generatePDF}>
                  {t("download-pdf")}
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px] whitespace-nowrap">{t("module")}</TableHead>
                      <TableHead className="w-[200px] whitespace-nowrap">VIN1</TableHead>
                      <TableHead className="w-[200px] whitespace-nowrap">VIN2</TableHead>
                      <TableHead className="w-[200px] whitespace-nowrap">VIN3</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tests.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell className="whitespace-nowrap">{test.kontrolmod || "-"}</TableCell>
                        <TableCell className="font-mono whitespace-nowrap">{test.vin1 || "-"}</TableCell>
                        <TableCell className="font-mono whitespace-nowrap">{test.vin2 || "-"}</TableCell>
                        <TableCell className="font-mono whitespace-nowrap">{test.vin3 || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            {t("test-details-could-not-be-loaded")}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}