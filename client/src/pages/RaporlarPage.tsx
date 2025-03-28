import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Loader2, FileDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { formatCurrency, replaceTurkishChars } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import { useAuth } from "@/hooks/use-auth";

// jsPDF için AutoTable tipini genişlet
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

interface KomisyonOzet {
  firma_adi: string;
  bayi_adi: string;
  bayi_aktif: boolean;
  toplam_ucret: number;
  toplam_komisyon: number;
  guncel_bakiye: number;
}

export default function RaporlarPage() {
  const [selectedFirma, setSelectedFirma] = useState<string>("all");
  const [selectedBayi, setSelectedBayi] = useState<string>("all");
  const [selectedAy, setSelectedAy] = useState<string>(new Date().getMonth() + 1 + "");
  const [selectedYil, setSelectedYil] = useState<string>(new Date().getFullYear().toString());
  const user = useAuth();

  const { data: firmaResponse } = useQuery<{ success: boolean; data: Array<{ id: number; name: string }> }>({
    queryKey: ["/api/companies"],
  });

  const { data: bayiResponse } = useQuery<{ success: boolean; data: Array<{ id: number; ad: string; firma: number }> }>({
    queryKey: ["/api/bayiler", selectedFirma !== "all" ? selectedFirma : null],
    queryFn: async () => {
      if (selectedFirma === "all") {
        return { success: true, data: [] };
      }

      const params = new URLSearchParams({
        firma_id: selectedFirma,
        limit: "1000",
      });

      const response = await fetch(`/api/bayiler?${params}`);
      if (!response.ok) {
        throw new Error("Bayi listesi alınamadı");
      }
      return response.json();
    },
    enabled: selectedFirma !== "all",
  });
  console.log( "gguuuu",user.user.bayi_id)

  const { data: response, isLoading } = useQuery<{ success: boolean, data: KomisyonOzet[] }>({
    queryKey: ["/api/raporlar/komisyon-ozet", {
      firma_id: selectedFirma,
      bayi_id: selectedBayi,
      ay: selectedAy,
      yil: selectedYil,
      role: user.user.role,
      user_bayi_id: user.user.bayi_id // Giriş yapan kullanıcının bayi ID'si

    }],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (selectedFirma !== "all") {
        params.append('firma_id', selectedFirma);
      }
      if (selectedBayi !== "all") {
        params.append('bayi_id', selectedBayi);
      }
      params.append('ay', selectedAy);
      params.append('yil', selectedYil);

      params.append('role', user.user.role);
      params.append('user_bayi_id', user.user.bayi_id);
   console.log("vcdddsds,",params)
      const response = await fetch(`/api/raporlar/komisyon-ozet?${params}`);
      if (!response.ok) {
        throw new Error("Komisyon verileri alınamadı");
      }
      return response.json();
    }
  });

  const komisyonlar = response?.data || [];
  const firmalar = firmaResponse?.data || [];

  const filteredBayiler = useMemo(() => {
    const bayiler = bayiResponse?.data || [];
    if (selectedFirma === "all") return bayiler;
    return bayiler.filter(bayi => bayi.firma === parseInt(selectedFirma));
  }, [bayiResponse?.data, selectedFirma]);

  const aylar = [
    { value: "1", label: "Ocak" },
    { value: "2", label: "Şubat" },
    { value: "3", label: "Mart" },
    { value: "4", label: "Nisan" },
    { value: "5", label: "Mayıs" },
    { value: "6", label: "Haziran" },
    { value: "7", label: "Temmuz" },
    { value: "8", label: "Ağustos" },
    { value: "9", label: "Eylül" },
    { value: "10", label: "Ekim" },
    { value: "11", label: "Kasım" },
    { value: "12", label: "Aralık" }
  ];

  const yillar = Array.from(
    { length: 5 },
    (_, i) => (new Date().getFullYear() - 2 + i).toString()
  );

  const handleFirmaChange = (value: string) => {
    setSelectedFirma(value);
    setSelectedBayi("all");
  };

  const handleBayiChange = (value: string) => {
    setSelectedBayi(value);
  };

  const handleAyChange = (value: string) => {
    setSelectedAy(value);
  };

  const handleYilChange = (value: string) => {
    setSelectedYil(value);
  };

  const totals = useMemo(() => {
    if (!komisyonlar.length) return null;

    return komisyonlar.reduce((acc, curr) => ({
      toplam_ucret: acc.toplam_ucret + Number(curr.toplam_ucret || 0),
      toplam_komisyon: acc.toplam_komisyon + Number(curr.toplam_komisyon || 0),
      guncel_bakiye: acc.guncel_bakiye + Number(curr.guncel_bakiye || 0),
    }), {
      toplam_ucret: 0,
      toplam_komisyon: 0,
      guncel_bakiye: 0,
    });
  }, [komisyonlar]);

  const formatMoneyForPDF = (value: number) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value) + " TL";
  };


  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'pt',
      format: 'a4',
      putOnlyUsedFonts: false,
      compress: true,
      hotfixes: ["px_scaling"]
    });

    doc.setFontSize(16);
    doc.text("Komisyon Raporu", 40, 40);

    doc.setFontSize(10);
    const selectedAyName = aylar.find(ay => ay.value === selectedAy)?.label || "";
    doc.text(`Donem: ${replaceTurkishChars(selectedAyName)} ${selectedYil}`, 40, 60);

    const tableData = komisyonlar.map((komisyon, index) => [
      (index + 1).toString(),
      replaceTurkishChars(komisyon.firma_adi || "-"),
      replaceTurkishChars(komisyon.bayi_adi),
      komisyon.bayi_aktif ? "Aktif" : "Pasif",
      formatMoneyForPDF(komisyon.toplam_ucret),
      formatMoneyForPDF(komisyon.toplam_komisyon),
      formatMoneyForPDF(komisyon.guncel_bakiye),
    ]);

    if (totals) {
      tableData.push([
        "",
        "TOPLAM",
        "",
        "",
        formatMoneyForPDF(totals.toplam_ucret),
        formatMoneyForPDF(totals.toplam_komisyon),
        formatMoneyForPDF(totals.guncel_bakiye),
      ]);
    }

    const headers = [
      ["No", "Firma", "Bayi", "Durum", "Toplam Ucret", "Toplam Komisyon", "Guncel Bakiye"]
    ];

    autoTable(doc, {
      head: headers,
      body: tableData,
      startY: 70,
      styles: {
        fontSize: 9,
        cellPadding: 3,
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        textColor: [0, 0, 0]
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 50 },
        4: { halign: 'right', cellWidth: 80 },
        5: { halign: 'right', cellWidth: 80 },
        6: { halign: 'right', cellWidth: 80 }
      },
      footStyles: {
        fillColor: [240, 240, 240],
        fontStyle: 'bold'
      },
      margin: { top: 10, right: 10, bottom: 10, left: 10 },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.text(
          `Sayfa ${doc.getNumberOfPages()}`,
          doc.internal.pageSize.width - 40,
          doc.internal.pageSize.height - 30
        );
      }
    });

    doc.save(`komisyon-raporu-${replaceTurkishChars(selectedAyName)}-${selectedYil}.pdf`);
  };

  return (
    <div className="space-y-4 p-2 sm:space-y-6 sm:p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Raporlar</h1>
        <p className="text-muted-foreground">Aylık Raporlar</p>
      </div>

      <Tabs defaultValue="komisyon" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="komisyon" className="flex-1 sm:flex-none">
            Komisyon Raporu
          </TabsTrigger>
        </TabsList>
        <TabsContent value="komisyon">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
              <CardTitle className="text-lg sm:text-xl">Komisyon Raporu</CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={handleExportPDF}
                disabled={isLoading || komisyonlar.length === 0}
              >
                <FileDown className="mr-2 h-4 w-4" />
                PDF'e Aktar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6">
                <Select value={selectedFirma} onValueChange={handleFirmaChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Firma Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Firmalar</SelectItem>
                    {firmalar.map((firma) => (
                      <SelectItem key={firma.id} value={firma.id.toString()}>
                        {firma.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedBayi}
                  onValueChange={handleBayiChange}
                  disabled={selectedFirma === "all"}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Bayi Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Bayiler</SelectItem>
                    {filteredBayiler.map((bayi) => (
                      <SelectItem key={bayi.id} value={bayi.id.toString()}>
                        {bayi.ad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedAy} onValueChange={handleAyChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Ay Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {aylar.map((ay) => (
                      <SelectItem key={ay.value} value={ay.value}>
                        {ay.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedYil} onValueChange={handleYilChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Yıl Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {yillar.map((yil) => (
                      <SelectItem key={yil} value={yil}>
                        {yil}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : komisyonlar.length === 0 ? (
                <div className="text-muted-foreground text-center py-4">
                  Henüz komisyon kaydı bulunmuyor
                </div>
              ) : (
                <div className="rounded-md border w-full max-w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="hidden sm:table-cell w-[50px] whitespace-nowrap">No</TableHead>
                        <TableHead className="hidden sm:table-cell whitespace-nowrap">Firma</TableHead>
                        <TableHead className="w-[40%] whitespace-nowrap text-sm">Bayi</TableHead>
                        <TableHead className="hidden sm:table-cell whitespace-nowrap">Durum</TableHead>
                        <TableHead className="hidden sm:table-cell text-right whitespace-nowrap">Toplam Ücret</TableHead>
                        <TableHead className="w-[30%] text-right whitespace-nowrap text-sm">Komisyon</TableHead>
                        <TableHead className="w-[30%] text-right whitespace-nowrap text-sm">Bakiye</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-sm">
                      {komisyonlar.map((komisyon, index) => (
                        <TableRow key={index} className="text-sm">
                          <TableCell className="hidden sm:table-cell whitespace-nowrap">{index + 1}</TableCell>
                          <TableCell className="hidden sm:table-cell whitespace-nowrap">{komisyon.firma_adi || '-'}</TableCell>
                          <TableCell className="whitespace-nowrap p-2 sm:p-4">{komisyon.bayi_adi}</TableCell>
                          <TableCell className="hidden sm:table-cell whitespace-nowrap">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                                komisyon.bayi_aktif
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              )}
                            >
                              {komisyon.bayi_aktif ? "Aktif" : "Pasif"}
                            </span>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-right whitespace-nowrap">
                            {formatCurrency(komisyon.toplam_ucret)}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap p-2 sm:p-4">
                            {formatCurrency(komisyon.toplam_komisyon)}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap p-2 sm:p-4">
                            {formatCurrency(komisyon.guncel_bakiye)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    {totals && (
                      <TableFooter>
                        <TableRow className="text-sm">
                          <TableCell colSpan={4} className="hidden sm:table-cell text-right font-medium whitespace-nowrap">
                            Toplam
                          </TableCell>
                          <TableCell colSpan={1} className="sm:hidden text-right font-medium whitespace-nowrap p-2">
                            Toplam
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-right whitespace-nowrap font-medium">
                            {formatCurrency(totals.toplam_ucret)}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap font-medium p-2 sm:p-4">
                            {formatCurrency(totals.toplam_komisyon)}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap font-medium p-2 sm:p-4">
                            {formatCurrency(totals.guncel_bakiye)}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    )}
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}