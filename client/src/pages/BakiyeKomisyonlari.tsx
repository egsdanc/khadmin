import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";

interface BakiyeKomisyon {
  id: number;
  bayi_id: number;
  bayi_adi: string;
  firma_adi?: string;
  manuel_yukleme: number;
  iyzico_yukleme: number;
  miktar: number;
  bakiye_sonrasi: number;
  aciklama?: string;
  created_at: string;
  bayi_aktif: boolean;
}

export default function BakiyeKomisyonlari() {
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  const { data, isLoading } = useQuery<{
    hareketler: BakiyeKomisyon[];
    total: number;
    totalPages: number;
  }>({
    queryKey: [
      "/api/bakiye/hareketler",
      page,
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
    ],
  });

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Bakiye Hareketleri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <DatePickerWithRange
              date={{
                from: dateRange.from,
                to: dateRange.to,
              }}
              setDate={(newDateRange) =>
                setDateRange({
                  from: newDateRange?.from,
                  to: newDateRange?.to,
                })
              }
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Firma</TableHead>
                  <TableHead>Bayi</TableHead>
                  <TableHead>Manuel Yükleme</TableHead>
                  <TableHead>İyzico Yükleme</TableHead>
                  <TableHead>Miktar</TableHead>
                  <TableHead>Bakiye</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>Tarih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.hareketler.map((hareket) => (
                  <TableRow key={hareket.id}>
                    <TableCell>{hareket.id}</TableCell>
                    <TableCell>{hareket.firma_adi}</TableCell>
                    <TableCell>{hareket.bayi_adi}</TableCell>
                    <TableCell>{formatCurrency(hareket.manuel_yukleme)}</TableCell>
                    <TableCell>{formatCurrency(hareket.iyzico_yukleme)}</TableCell>
                    <TableCell>{formatCurrency(hareket.miktar)}</TableCell>
                    <TableCell>{formatCurrency(hareket.bakiye_sonrasi)}</TableCell>
                    <TableCell>{hareket.aciklama}</TableCell>
                    <TableCell>
                      {format(new Date(hareket.created_at), "dd.MM.yyyy HH:mm", {
                        locale: tr,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Önceki
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page === data?.totalPages}
            >
              Sonraki
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}