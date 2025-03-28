import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { KilometreDetailsModal } from "./KilometreDetailsModal";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface KilometreRecord {
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
}

interface ApiResponse {
  success: boolean;
  data: KilometreRecord[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

export function KilometreList() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterBy, setFilterBy] = useState<"plaka" | "marka">("plaka");
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const itemsPerPage = 10;
  const { user } = useAuth();

  const { data: response, isLoading } = useQuery<ApiResponse>({
    queryKey: ["/api/kilometre", { page: currentPage, limit: itemsPerPage, startDate, endDate, search, filterBy }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      params.append('user', JSON.stringify(user));
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (search) params.append(filterBy, search);

      const response = await fetch(`/api/kilometre?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      console.log("API Response:", data); // Debug log
      return data;
    }
  });

  const records = response?.data || [];
  console.log("Processed records:", records); // Debug log

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-lg text-muted-foreground">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="space-y-2">
          <Label htmlFor="startDate">Başlangıç Tarihi</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full h-10"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">Bitiş Tarihi</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full h-10"
          />
        </div>
        <div className="space-y-2">
          <Label>&nbsp;</Label>
          <Button
            onClick={() => setCurrentPage(1)}
            className="w-full h-10 bg-[#0F1729] hover:bg-[#1a2436] text-white"
          >
            Sorgula
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-end mb-4">
        <div className="w-full sm:w-auto">
          <Label className="text-sm font-medium">Plaka/Model</Label>
          <Select value={filterBy} onValueChange={(value: "plaka" | "marka") => setFilterBy(value)}>
            <SelectTrigger className="w-full sm:w-[180px] h-11">
              <SelectValue placeholder="Plaka" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="plaka">Plaka</SelectItem>
              <SelectItem value="marka">Marka/Model</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-auto flex-1">
          <Label className="text-sm font-medium">Arama</Label>
          <Input
            placeholder={filterBy === "plaka" ? "Plaka ile ara..." : "Marka/Model ile ara..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11"
          />
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">No</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>Plaka</TableHead>
              <TableHead className="hidden md:table-cell">Marka/Model</TableHead>
              <TableHead className="hidden md:table-cell">Şase No</TableHead>
              <TableHead className="hidden md:table-cell">Motor No</TableHead>
              <TableHead className="hidden md:table-cell">Firma</TableHead>
              <TableHead className="hidden md:table-cell">Bayi</TableHead>
              <TableHead className="text-right hidden md:table-cell">Gösterge KM</TableHead>
              <TableHead className="text-right hidden md:table-cell">Ücret</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length > 0 ? (
              records.map((record, index) => (
                <TableRow key={`record-${record.id}-${index}`}>
                  <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                  <TableCell>{formatDate(record.tarih)}</TableCell>
                  <TableCell className="font-medium whitespace-nowrap">{record.plaka}</TableCell>
                  <TableCell className="hidden md:table-cell whitespace-nowrap">{`${record.marka} ${record.model}`}</TableCell>
                  <TableCell className="hidden md:table-cell">{record.sase}</TableCell>
                  <TableCell className="hidden md:table-cell">{record.motor}</TableCell>
                  <TableCell className="hidden md:table-cell">{record.firma_adi || "-"}</TableCell>
                  <TableCell className="hidden md:table-cell">{record.bayi_adi || "-"}</TableCell>
                  <TableCell className="text-right font-mono hidden md:table-cell">{record.gosterge_km}</TableCell>
                  <TableCell className="text-right hidden md:table-cell">{record.ucret} TL</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTestId(record.test_id)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                      </svg>
                      Detay
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={11} className="h-24 text-center">
                  {search || startDate || endDate ?
                    "Arama kriterlerine uygun kayıt bulunamadı." :
                    "Kayıtlı veri bulunamadı."
                  }
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {response && response.pagination.total > 0 && (
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              Toplam {response.pagination.total} kayıt ({(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, response.pagination.total)} arası)
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Önceki
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(response.pagination.totalPages, prev + 1))}
                disabled={currentPage === response.pagination.totalPages}
              >
                Sonraki
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <KilometreDetailsModal
        isOpen={!!selectedTestId}
        onClose={() => setSelectedTestId(null)}
        testId={selectedTestId}
      />
    </div>
  );
}