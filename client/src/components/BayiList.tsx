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
import { useLanguage } from "@/contexts/LanguageContext";

interface Bayi {
  id: number;
  ad: string;
  firma: number;
  firma_name: string | null;
  aktif: boolean;
  email: string | null;
  telefon: string | null;
  adres: string | null;
  ulke_id?: number;
  il: string | null;
  ilce: string | null;
  bayi_oran: number;
  vergi_dairesi: string | null;
  vergi_no: string | null;
  bakiye: number;
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

// Format balance with Turkish locale
const formatBalance = (amount: number | string | null | undefined): string => {
  console.log('formatBalance input:', amount, 'type:', typeof amount);
  
  if (!amount && amount !== 0) return "0,00 TL";
  
  // Convert to number if it's a string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return "0,00 TL";
  
  const formatted = `${numAmount.toLocaleString('tr-TR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2, 
    useGrouping: true 
  })} TL`;
  
  console.log('formatBalance output:', formatted);
  return formatted;
};

export function BayiList() {
  const { t } = useLanguage();
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
        ...(firmaFilter !== "all" && { firmaId: firmaFilter }),
        ...(durumFilter !== "all" && { aktif: durumFilter === "aktif" ? "true" : "false" })
      });

      console.log('Fetching data with params:', {
        currentPage,
        itemsPerPage,
        searchTerm: debouncedSearchTerm,
        firmaId: firmaFilter,
        aktif: durumFilter
      });

      const response = await fetch(`/api/bayiler?${params}`);
      if (!response.ok) {
        throw new Error(t('api-request-failed'));
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
        throw new Error(t('error-loading-companies'));
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
        throw new Error(t('error-deleting-dealer'));
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bayiler'] });
      toast({
        description: t('dealer-deleted-successfully'),
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: t('error'),
        description: error instanceof Error ? error.message : t('error-deleting-dealer'),
      });
    },
  });

  const bayiler = response?.data || [];
  const pagination = response?.pagination || { total: 0, totalPages: 1, currentPage: 1, limit: itemsPerPage };

  console.log('Pagination data:', pagination);
console.log('Bayiler:', bayiler);
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
            placeholder={t('search-by-name-or-contact')}
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
            <SelectValue placeholder={t('select-status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all')}</SelectItem>
            <SelectItem value="aktif">{t('active')}</SelectItem>
            <SelectItem value="pasif">{t('inactive')}</SelectItem>
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
            <SelectValue placeholder={t('select-company')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all-companies')}</SelectItem>
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
          {t('add-dealer')}
        </Button>
      </div>

      {/* Desktop Tablo */}
      <div className="hidden lg:block rounded-md border">
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
                  <TableHead className="w-[50px] text-xs font-medium">{t('no')}</TableHead>
                  <TableHead className="text-xs font-medium">{t('dealer-name')}</TableHead>
                  <TableHead className="text-xs font-medium">{t('company')}</TableHead>
                  <TableHead className="text-xs font-medium">{t('city-district')}</TableHead>
                  <TableHead className="text-xs font-medium">{t('email')}</TableHead>
                  <TableHead className="text-xs font-medium">{t('phone')}</TableHead>
                  <TableHead className="text-xs font-medium">{t('status')}</TableHead>
                  <TableHead className="w-[60px] text-xs font-medium">{t('dealer-rate')} (%)</TableHead>
                  <TableHead className="text-xs font-medium">{t('dealer-balance')}</TableHead>
                  <TableHead className="text-xs font-medium">{t('tax-office')}</TableHead>
                  <TableHead className="text-xs font-medium">{t('tax-number')}</TableHead>
                  <TableHead className="w-[100px] text-right text-xs font-medium">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bayiler.length > 0 ? (
                  bayiler.map((bayi, index) => (
                    <TableRow key={bayi.id}>
                      <TableCell className="font-medium text-xs">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell className="text-xs">{bayi.ad}</TableCell>
                      <TableCell className="text-xs">{bayi.firma_name || "-"}</TableCell>
                      <TableCell className="text-xs">
                        {bayi.il && bayi.ilce ? `${bayi.il} / ${bayi.ilce}` : "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {bayi.email || "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {bayi.telefon || "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span
                          className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ${
                            bayi.aktif
                              ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                              : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                          }`}
                        >
                          {bayi.aktif ? t('active') : t('inactive')}
                        </span>
                      </TableCell>
                      <TableCell className="w-[60px] text-center text-xs">
                        {bayi.bayi_oran ? `${bayi.bayi_oran}%` : "0%"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatBalance(bayi.bakiye)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {bayi.vergi_dairesi || "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {bayi.vergi_no || "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              setSelectedBayi(bayi);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                            <span className="sr-only">Düzenle</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              setSelectedBayi(bayi);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
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
                        ? t('no-dealers-found-matching-criteria')
                        : t('no-dealers-found')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Mobile Kartlar */}
      <div className="lg:hidden space-y-4">
        {isLoading && (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
        
        {bayiler.length > 0 ? (
          bayiler.map((bayi, index) => (
            <div key={bayi.id} className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900">{bayi.ad}</h3>
                  <p className="text-sm text-gray-600">{bayi.firma_name || "-"}</p>
                </div>
                <div className="flex gap-2">
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
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">{t('city-district')}:</span>
                  <p className="font-medium">{bayi.il && bayi.ilce ? `${bayi.il} / ${bayi.ilce}` : "-"}</p>
                </div>
                <div>
                  <span className="text-gray-500">{t('status')}:</span>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                        bayi.aktif
                          ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                          : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                      }`}
                    >
                      {bayi.aktif ? t('active') : t('inactive')}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">{t('email')}:</span>
                  <p className="font-medium">{bayi.email || "-"}</p>
                </div>
                <div>
                  <span className="text-gray-500">{t('phone')}:</span>
                  <p className="font-medium">{bayi.telefon || "-"}</p>
                </div>
                <div>
                  <span className="text-gray-500">{t('dealer-rate')} (%):</span>
                  <p className="font-medium">{bayi.bayi_oran ? `${bayi.bayi_oran}%` : "0%"}</p>
                </div>
                <div>
                  <span className="text-gray-500">{t('dealer-balance')}:</span>
                  <p className="font-medium">{formatBalance(bayi.bakiye)}</p>
                </div>
                <div>
                  <span className="text-gray-500">{t('tax-office')}:</span>
                  <p className="font-medium">{bayi.vergi_dairesi || "-"}</p>
                </div>
                <div>
                  <span className="text-gray-500">{t('tax-number')}:</span>
                  <p className="font-medium">{bayi.vergi_no || "-"}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {debouncedSearchTerm || firmaFilter !== "all" || durumFilter !== "all"
                ? t('no-dealers-found-matching-criteria')
                : t('no-dealers-found')}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {bayiler.length > 0 && pagination && (
        <TablePagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={setCurrentPage}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
        />
      )}

      {/* Dialoglar */}
      <BayiEditDialog
        bayi={selectedBayi}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete-dealer')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete-dealer-confirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (selectedBayi) {
                  deleteBayiMutation.mutate(selectedBayi.id);
                }
              }}
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}