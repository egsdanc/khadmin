import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { format, startOfDay, endOfDay } from "date-fns";
import { tr } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { DateRange } from "react-day-picker";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/utils";

interface BakiyeKomisyon {
  id: number;
  test_id: number;
  firma_id: number;
  bayi_id: number;
  bayi_oran: number;
  ucret: number;
  komisyon_tutar: number;
  test_komisyon_tutar: number;
  bakiye: number;
  created_at: string;
  firma_name?: string;
  bayi_name?: string;
}

interface Firma {
  id: number;
  name: string;
}

interface Bayi {
  id: number;
  ad: string;
  firma: number;
}

export default function KomisyonYonetimi() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [selectedFirma, setSelectedFirma] = useState<number | null>(null);
  const [selectedBayi, setSelectedBayi] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });

  const { data: firmalarResponse } = useQuery<{ data: Firma[] }>({
    queryKey: ["/api/companies"],
  });

  const { data: bayilerResponse, isLoading: bayilerLoading } = useQuery<{ data: Bayi[] }>({
    queryKey: ["/api/bayiler", selectedFirma],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (selectedFirma) {
        params.append('firmaId', selectedFirma.toString());
      }

      params.append('limit', '1000');
      params.append('offset', '0');

      const response = await fetch(`/api/bayiler?${params}`);
      if (!response.ok) {
        throw new Error('Bayi listesi alınamadı');
      }
      const data = await response.json();
      return data;
    },
    enabled: true
  });

  const firmalar = firmalarResponse?.data || [];
  const bayiler = bayilerResponse?.data || [];

  const { data, isLoading, refetch } = useQuery<{
    komisyonlar: BakiyeKomisyon[];
    total: number;
    totalPages: number;
    currentPage: number;
    params: any;
  }>({
    queryKey: ["/api/bakiye/komisyonlar", page, selectedFirma, selectedBayi, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(selectedFirma && { firma_id: selectedFirma.toString() }),
        ...(selectedBayi && { bayi_id: selectedBayi.toString() }),
        ...(dateRange.from && { start_date: dateRange.from.toISOString() }),
        ...(dateRange.to && { end_date: dateRange.to.toISOString() }),
      });

      const response = await fetch(`/api/bakiye/komisyonlar?${params}`);
      if (!response.ok) {
        throw new Error('Komisyon verileri alınamadı');
      }
      return response.json();
    },
    enabled: true,
    refetchInterval: 30000, // 30 saniyede bir yenile
    refetchOnWindowFocus: true, // Sayfa aktif olduğunda yenile
    refetchOnMount: true, // Komponent mount olduğunda yenile
    refetchOnReconnect: true // İnternet bağlantısı tekrar sağlandığında yenile
  });

  const handleFirmaChange = (value: string) => {
    const firmaId = value === "all" ? null : Number(value);
    setSelectedFirma(firmaId);
    setSelectedBayi(null);
  };

  const handleBayiChange = (value: string) => {
    const bayiId = value === "all" ? null : Number(value);
    setSelectedBayi(bayiId);
  };

  const handleDateChange = (range: DateRange | undefined) => {
    if (range) {
      setDateRange({
        from: range.from ? startOfDay(range.from) : undefined,
        to: range.to ? endOfDay(range.to) : undefined,
      });
    }
  };

  const handleFilter = async () => {
    try {
      setPage(1);
      await refetch();
      toast({
        description: t('filtering-successful'),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('error-during-filtering'),
      });
    }
  };

  const filteredBayiler = selectedFirma
    ? bayiler.filter((bayi) => bayi.firma === selectedFirma)
    : bayiler;

  return (
    <div className="container mx-auto py-4 px-2 sm:px-4 md:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">{t('commission-management')}</h1>
      <p className="text-muted-foreground">{t('view-edit-and-manage-commission-management')}</p>
      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
              <Select
                value={selectedFirma ? selectedFirma.toString() : "all"}
                onValueChange={handleFirmaChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('select-company')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all')}</SelectItem>
                  {firmalar.map((firma) => (
                    <SelectItem key={firma.id} value={firma.id.toString()}>
                      {firma.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedBayi ? selectedBayi.toString() : "all"}
                onValueChange={handleBayiChange}
                disabled={!filteredBayiler?.length || bayilerLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('select-dealer')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all')}</SelectItem>
                  {filteredBayiler.map((bayi) => (
                    <SelectItem key={bayi.id} value={bayi.id.toString()}>
                      {bayi.ad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <DatePickerWithRange
                date={dateRange}
                setDate={handleDateChange}
                className="w-full"
              />

              <Button
                onClick={handleFilter}
                disabled={isLoading || bayilerLoading}
                className="w-full"
              >
                {isLoading || bayilerLoading ? t('loading') : t('filter')}
              </Button>
            </div>
          </div>

          <div className="rounded-md border overflow-hidden">
            <ScrollArea className="w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">{t('no')}</TableHead>
                    <TableHead className="whitespace-nowrap">{t('company')}</TableHead>
                    <TableHead className="whitespace-nowrap">{t('dealer')}</TableHead>
                    <TableHead className="hidden md:table-cell whitespace-nowrap">{t('test-id')}</TableHead>
                    <TableHead className="hidden md:table-cell whitespace-nowrap">{t('dealer-rate-percentage')}</TableHead>
                    <TableHead className="hidden md:table-cell whitespace-nowrap">{t('fee')}</TableHead>
                    <TableHead className="hidden md:table-cell whitespace-nowrap">{t('test-commission-amount')}</TableHead>
                    <TableHead className="whitespace-nowrap">{t('commission-amount')}</TableHead>
                    <TableHead className="whitespace-nowrap">{t('balance')}</TableHead>
                    <TableHead className="hidden md:table-cell whitespace-nowrap">{t('date')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [...Array(5)].map((_, index) => (
                      <TableRow key={index}>
                        {[...Array(10)].map((_, cellIndex) => (
                          <TableCell key={cellIndex}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : data?.komisyonlar && data.komisyonlar.length > 0 ? (
                    <>
                      {data.komisyonlar.map((komisyon, index) => (
                        <TableRow key={komisyon.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{komisyon.firma_name}</TableCell>
                          <TableCell>{komisyon.bayi_name}</TableCell>
                          <TableCell className="hidden md:table-cell">{komisyon.test_id}</TableCell>
                          <TableCell className="hidden md:table-cell">{komisyon.bayi_oran}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {formatCurrency(komisyon.ucret)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {formatCurrency(komisyon.test_komisyon_tutar)}
                          </TableCell>
                          <TableCell>{formatCurrency(komisyon.komisyon_tutar)}</TableCell>
                          <TableCell>{formatCurrency(komisyon.bakiye)}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {format(new Date(komisyon.created_at), "dd.MM.yyyy HH:mm", {
                              locale: tr,
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold bg-muted/50">
                        <TableCell></TableCell>
                        <TableCell colSpan={4}>Toplam</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {formatCurrency(
                            data.komisyonlar.reduce((sum, item) => sum + Number(item.ucret), 0)
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {formatCurrency(
                            data.komisyonlar.reduce((sum, item) => sum + Number(item.test_komisyon_tutar), 0)
                          )}
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell className="hidden md:table-cell"></TableCell>
                      </TableRow>
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-4">
                        {t('no-records-found')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          <div className="flex items-center justify-end space-x-2 py-4 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1 || isLoading || bayilerLoading}
              className="min-w-[80px]"
            >
              {t('previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === data?.totalPages || isLoading || bayilerLoading}
              className="min-w-[80px]"
            >
              {t('next')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}