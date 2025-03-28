import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlusCircle, Pencil, Trash2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { BayiEditDialog } from "./BayiEditDialog";
import { useToast } from "@/hooks/use-toast";
import { TablePagination } from "./TablePagination";

interface Bayi {
  id: number;
  ad: string;
  firma: number;
  firma_name: string | null;
  aktif: boolean;
  email: string | null;
  telefon: string | null;
  adres: string | null;
  il: string | null;
  ilce: string | null;
  bayi_oran: number;
  vergi_dairesi: string | null;
  vergi_no: string | null;
}

interface ApiResponse {
  success: boolean;
  data: Bayi[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

export function BayiList() {
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [durumFilter, setDurumFilter] = useState<string>("all");
  const [firmaFilter, setFirmaFilter] = useState<string>("all");
  const [selectedBayi, setSelectedBayi] = useState<Bayi | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const itemsPerPage = 10;
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchInput);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: response, isLoading } = useQuery<ApiResponse>({
    queryKey: [
      "/api/bayiler",
      currentPage,
      itemsPerPage,
      debouncedSearchTerm,
      firmaFilter,
      durumFilter
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
        ...(firmaFilter !== "all" && { firma_id: firmaFilter }),
        ...(durumFilter !== "all" && { aktif: durumFilter === "aktif" ? "true" : "false" })
      });

      console.log('Fetching data with params:', {
        currentPage,
        itemsPerPage,
        searchTerm: debouncedSearchTerm,
        firma: firmaFilter,
        durum: durumFilter
      });

      const response = await fetch(`/api/bayiler?${params}`);
      if (!response.ok) {
        throw new Error('API isteği başarısız oldu');
      }
      const data = await response.json();
      console.log('API Response:', data);
      return data;
    },
    refetchOnMount: true,
    staleTime: 0, // Always refetch when component mounts or query is invalidated
  });

  const { data: firmaResponse } = useQuery({
    queryKey: ['/api/companies'],
    queryFn: async () => {
      const response = await fetch("/api/companies");
      if (!response.ok) {
        throw new Error('Firma listesi alınamadı');
      }
      return response.json();
    }
  });

  const deleteBayiMutation = useMutation({
    mutationFn: async (bayiId: number) => {
      const response = await fetch(`/api/bayiler/${bayiId}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        throw new Error('Bayi silme işlemi başarısız oldu');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bayiler'] });
      toast({
        description: "Bayi başarıyla silindi",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error instanceof Error ? error.message : "Bayi silinirken bir hata oluştu",
      });
    },
  });

  const bayiler = response?.data || [];
  const pagination = response?.pagination || { total: 0, totalPages: 1, currentPage: 1, limit: itemsPerPage };

  console.log('Pagination data:', pagination);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtreler */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="İsim veya iletişim bilgileri ile ara..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full"
          />
        </div>

        <Select
          value={durumFilter}
          onValueChange={(value) => {
            setDurumFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Durum Seçin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="aktif">Aktif</SelectItem>
            <SelectItem value="pasif">Pasif</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={firmaFilter}
          onValueChange={(value) => {
            setFirmaFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Firma Seçin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Firmalar</SelectItem>
            {firmaResponse?.data?.map((firma: any) => (
              <SelectItem key={firma.id} value={firma.id.toString()}>
                {firma.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={() => {
            setSelectedBayi(null);
            setIsEditDialogOpen(true);
          }}
          className="w-full sm:w-auto justify-center"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Bayi Ekle
        </Button>
      </div>

      {/* Tablo */}
      <div className="rounded-md border">
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-50">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">No</TableHead>
                  <TableHead>Bayi Adı</TableHead>
                  <TableHead>Firma</TableHead>
                  <TableHead className="hidden md:table-cell">İl/İlçe</TableHead>
                  <TableHead className="hidden lg:table-cell">E-posta</TableHead>
                  <TableHead className="hidden lg:table-cell">Telefon</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="hidden lg:table-cell">Bayi Oranı (%)</TableHead>
                  <TableHead className="hidden lg:table-cell">Vergi Dairesi</TableHead>
                  <TableHead className="hidden lg:table-cell">Vergi No</TableHead>
                  <TableHead className="w-[100px] text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bayiler.length > 0 ? (
                  bayiler.map((bayi, index) => (
                    <TableRow key={bayi.id}>
                      <TableCell className="font-medium">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell>{bayi.ad}</TableCell>
                      <TableCell>{bayi.firma_name || "-"}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {bayi.il && bayi.ilce ? `${bayi.il} / ${bayi.ilce}` : "-"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {bayi.email || "-"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {bayi.telefon || "-"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                            bayi.aktif
                              ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                              : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                          }`}
                        >
                          {bayi.aktif ? "Aktif" : "Pasif"}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {bayi.bayi_oran ? `${bayi.bayi_oran}%` : "0%"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {bayi.vergi_dairesi || "-"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {bayi.vergi_no || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedBayi(bayi);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Düzenle</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedBayi(bayi);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Sil</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="h-24 text-center">
                      {debouncedSearchTerm || firmaFilter !== "all" || durumFilter !== "all"
                        ? "Arama kriterlerine uygun bayi bulunamadı"
                        : "Kayıtlı bayi bulunamadı"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {bayiler.length > 0 && pagination && (
          <TablePagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={setCurrentPage}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
          />
        )}
      </div>

      {/* Dialoglar */}
      <BayiEditDialog
        bayi={selectedBayi}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bayiyi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu bayiyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (selectedBayi) {
                  deleteBayiMutation.mutate(selectedBayi.id);
                }
              }}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}