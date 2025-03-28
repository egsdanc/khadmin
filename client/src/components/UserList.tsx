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
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface User {
  id: number;
  isim: string;
  macAdress: string;
  firstlogin: number;
  firma: number | null;
  bayi: number | null;
  created_at: string;
}

interface ApiResponse {
  success: boolean;
  data: User[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

export function UserList() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchInput);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: response, isLoading, isFetching } = useQuery<ApiResponse>({
    queryKey: [
      "/api/kullanicilar",
      currentPage,
      itemsPerPage,
      debouncedSearchTerm
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(debouncedSearchTerm && { search: debouncedSearchTerm })
      });

      const response = await fetch(`/api/kullanicilar?${params}`, {
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error('API isteği başarısız oldu');
      }

      return response.json();
    }
  });

  if (isLoading && !response) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="İsim veya MAC adresi ile ara..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full"
          />
          {isFetching && searchInput && (
            <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <div className="relative">
          {isFetching && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-50">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">No</TableHead>
                  <TableHead>İsim</TableHead>
                  <TableHead>MAC Adresi</TableHead>
                  <TableHead>Firma</TableHead>
                  <TableHead>Bayi</TableHead>
                  <TableHead>İlk Giriş</TableHead>
                  <TableHead>Kayıt Tarihi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {response?.data && response.data.length > 0 ? (
                  response.data.map((user, index) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell>{user.isim}</TableCell>
                      <TableCell>{user.macAdress}</TableCell>
                      <TableCell>{user.firma || "-"}</TableCell>
                      <TableCell>{user.bayi || "-"}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                          user.firstlogin === 1
                            ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                            : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
                        }`}>
                          {user.firstlogin === 0 ? 'Yapılmadı' : 'Yapıldı'}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString('tr-TR')}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      {debouncedSearchTerm
                        ? "Arama kriterlerine uygun kullanıcı bulunamadı"
                        : "Kullanıcı bulunamadı"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Sayfalama */}
        {response?.data && response.data.length > 0 && response.pagination && (
          <div className="flex flex-col gap-2 items-center p-4 border-t">
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Önceki
              </Button>

              {Array.from({ length: Math.min(3, response.pagination.totalPages) }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}

              {response.pagination.totalPages > 3 && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(prev => Math.min(response.pagination.totalPages, prev + 1))}
                  disabled={currentPage === response.pagination.totalPages}
                >
                  Sonraki
                </Button>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Toplam {response.pagination.total} kayıt (1 - {Math.min(itemsPerPage, response.pagination.total)} arası)
            </div>
          </div>
        )}
      </div>
    </div>
  );
}