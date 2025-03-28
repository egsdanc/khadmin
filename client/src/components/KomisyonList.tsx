import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

interface BakiyeHareketi {
  id: number;
  bayi_id: number;
  bayi_adi: string;
  firma_adi?: string;
  manuel_yukleme: number;
  miktar: number;
  bakiye_sonrasi: number;
  aciklama?: string;
  created_at: string;
}

interface ApiResponse {
  success: boolean;
  hareketler: BakiyeHareketi[];
  total: number;
  totalPages: number;
}

export function BakiyeGecmisi() {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const { data: response, isLoading } = useQuery<ApiResponse>({
    queryKey: ['/api/bakiye/hareketler', { 
      page: currentPage, 
      limit,
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const hareketler = response?.hareketler || [];
  const total = response?.total || 0;
  const totalPages = response?.totalPages || 1;

  const getPageRange = () => {
    const range = [];
    const maxVisiblePages = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Bakiye Geçmişi</h2>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarih</TableHead>
              <TableHead>Bayi</TableHead>
              <TableHead>Firma</TableHead>
              <TableHead className="text-right">İşlem Detayı</TableHead>
              <TableHead>Açıklama</TableHead>
              <TableHead className="text-right">Bakiye</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hareketler.map((hareket) => (
              <TableRow key={hareket.id}>
                <TableCell>
                  {new Date(hareket.created_at).toLocaleDateString('tr-TR')}
                </TableCell>
                <TableCell>{hareket.bayi_adi}</TableCell>
                <TableCell>{hareket.firma_adi || '-'}</TableCell>
                <TableCell className="text-right text-green-600">
                  {hareket.manuel_yukleme > 0 ? formatCurrency(hareket.manuel_yukleme) : '-'}
                </TableCell>
                <TableCell>{hareket.aciklama}</TableCell>
                <TableCell className="text-right">{formatCurrency(hareket.bakiye_sonrasi)}</TableCell>
              </TableRow>
            ))}
            {hareketler.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  Bakiye hareketi bulunamadı
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {hareketler.length > 0 && (
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              Toplam {total} kayıt ({(currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, total)} arası)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Önceki
              </button>

              {getPageRange().map(pageNumber => (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`px-3 py-2 border rounded-md ${
                    currentPage === pageNumber
                      ? 'bg-primary text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Sonraki
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}