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
import { VINDetailsModal } from "./VINDetailsModal";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/contexts/LanguageContext";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

interface VINRecord {
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
  firma_adi: string;
  bayi_adi: string;
}

interface ApiResponse {
  success: boolean;
  data: VINRecord[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

export function VINList() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterBy, setFilterBy] = useState<"plaka" | "marka">("plaka");
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const itemsPerPage = 10;
  const { user } = useAuth();

  const { data: response, isLoading } = useQuery<ApiResponse>({
    queryKey: ["/api/vinreader", { page: currentPage, limit: itemsPerPage, startDate: dateRange?.from?.toISOString().split('T')[0], endDate: dateRange?.to?.toISOString().split('T')[0] }],
    queryFn: async () => {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      params.append('user', JSON.stringify(user));
      if (dateRange?.from) params.append('startDate', dateRange.from.toISOString().split('T')[0]);
      if (dateRange?.to) params.append('endDate', dateRange.to.toISOString().split('T')[0]);

      const response = await fetch(`/api/vinreader?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
    enabled: !!user, // Sadece user varsa sorguyu çalıştır
    // refetchInterval: 3000,
    staleTime: 60000,  // 1 dakika
    refetchOnWindowFocus: true
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-lg text-muted-foreground">{t('loading')}</div>
      </div>
    );
  }

  const records = response?.data || [];
  const filteredRecords = records.filter(record => {
    const searchTerm = search.toLowerCase();
    const searchMatch = filterBy === "plaka"
      ? record.plaka.toLowerCase().includes(searchTerm)
      : `${record.marka} ${record.model}`.toLowerCase().includes(searchTerm);

    const recordDate = new Date(record.tarih);
    const start = dateRange?.from ? new Date(dateRange.from) : null;
    const end = dateRange?.to ? new Date(dateRange.to) : null;

    const dateMatch = (!start || recordDate >= start) && (!end || recordDate <= end);

    return searchMatch && dateMatch;
  });

  const totalPages = response?.pagination.totalPages || 1;

  const handleFilter = () => {
    setCurrentPage(1);
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="space-y-2">
          <Label htmlFor="dateRange">{t('date-range')}</Label>
          <DatePickerWithRange
            date={dateRange}
            setDate={setDateRange}
          />
        </div>
        <div className="space-y-2">
          <Label>&nbsp;</Label>
          <Button
            onClick={handleFilter}
            className="w-full h-10 bg-[#0F1729] hover:bg-[#1a2436] text-white"
          >
            {t('query')}
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-end mb-4">
        <div className="w-full sm:w-auto">
          <Label className="text-sm font-medium">{t('plate-model')}</Label>
          <Select value={filterBy} onValueChange={(value: "plaka" | "marka") => setFilterBy(value)}>
            <SelectTrigger className="w-full sm:w-[180px] h-11">
              <SelectValue placeholder={t('plate')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="plaka">{t('plate')}</SelectItem>
              <SelectItem value="marka">{t('brand-model')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-auto flex-1">
          <Label className="text-sm font-medium">{t('search')}</Label>
          <Input
            placeholder={filterBy === "plaka" ? t('search-by-plate') : t('search-by-brand-model')}
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
              <TableHead className="w-[50px]">{t('no')}</TableHead>
              <TableHead>{t('date')}</TableHead>
              <TableHead>{t('plate')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('brand-model')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('chassis-number')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('engine-number')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('company')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('dealer')}</TableHead>
              <TableHead className="text-right hidden md:table-cell">{t('odometer-km')}</TableHead>
              <TableHead className="text-right hidden sm:table-cell">{t('fee')}</TableHead>
              <TableHead className="text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record, index) => (
                <TableRow key={record.test_id}>
                  <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                  <TableCell>{formatDate(record.tarih)}</TableCell>
                  <TableCell className="font-medium">{record.plaka}</TableCell>
                  <TableCell className="hidden md:table-cell">{`${record.marka} ${record.model}`}</TableCell>
                  <TableCell className="hidden md:table-cell">{record.sase}</TableCell>
                  <TableCell className="hidden lg:table-cell">{record.motor}</TableCell>
                  <TableCell className="hidden md:table-cell">{record.firma_adi || "-"}</TableCell>
                  <TableCell className="hidden md:table-cell">{record.bayi_adi || "-"}</TableCell>
                  <TableCell className="text-right font-mono hidden md:table-cell">{record.gosterge_km}</TableCell>
                  <TableCell className="text-right hidden sm:table-cell">{record.ucret} TL</TableCell>
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
{t('details')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={11} className="h-24 text-center">
                  {search || dateRange?.from || dateRange?.to ?
                    t('no-records-found-matching-criteria') :
                    t('no-records-found')
                  }
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {response && response.pagination.total > 0 && (
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              {t('total')} {response.pagination.total} {t('records')} ({(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, response.pagination.total)} {t('range')})
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
{t('previous')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
{t('next')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <VINDetailsModal
        isOpen={!!selectedTestId}
        onClose={() => setSelectedTestId(null)}
        testId={selectedTestId}
      />
    </div>
  );
}