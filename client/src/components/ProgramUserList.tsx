import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ProgramUserEditDialog } from "./ProgramUserEditDialog";
import { TablePagination } from "./TablePagination";
import { Skeleton } from "@/components/ui/skeleton";

interface ProgramUser {
  id: number;
  isim: string;
  macAdress: string;
  firstlogin: number;
  bayi_id: number | null;
  bayi_name: string | null;
  firma_id: number | null;
  firma_name: string | null;
}

interface ApiResponse {
  success: boolean;
  data: ProgramUser[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

export function ProgramUserList() {
  const [selectedUser, setSelectedUser] = useState<ProgramUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFirma, setSelectedFirma] = useState<string>("all");
  const [selectedBayi, setSelectedBayi] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const itemsPerPage = 10;

  const { data: response, isLoading } = useQuery<ApiResponse>({
    queryKey: [
      "/api/kullanicilar",
      currentPage,
      itemsPerPage,
      searchTerm,
      selectedFirma,
      selectedBayi
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (selectedFirma !== "all") {
        params.append('firma_id', selectedFirma);
      }
      if (selectedBayi !== "all") {
        params.append('bayi', selectedBayi);
      }

      const response = await fetch(`/api/kullanicilar?${params}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    }
  });

  const { data: branchesResponse } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ["/api/bayiler"]
  });

  const { data: companiesResponse } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ["/api/companies"]
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/kullanicilar/${userId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kullanicilar"] });
      toast({
        title: "Başarılı",
        description: "Program kullanıcısı başarıyla silindi",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: `Program kullanıcısı silinirken bir hata oluştu: ${error}`,
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const users = response?.data || [];
  const pagination = response?.pagination;

  return (
    <div className="space-y-2 sm:space-y-4">
      {/* Filtreleme alanı */}
      <div className="flex flex-col gap-2 sm:gap-3 p-2 sm:p-0">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="İsim veya MAC adresi ile ara..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 min-w-0"
          />
          <Button
            variant="secondary"
            onClick={handleSearch}
            className="w-full sm:w-auto whitespace-nowrap"
          >
            <Search className="h-4 w-4 mr-2" />
            <span>Ara</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          <Select
            value={selectedFirma}
            onValueChange={(value) => {
              setSelectedFirma(value);
              setSelectedBayi("all");
              setCurrentPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Firma Seç" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Firmalar</SelectItem>
              {companiesResponse?.data?.map((company) => (
                <SelectItem key={company.id} value={company.id.toString()}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedBayi}
            onValueChange={(value) => {
              setSelectedBayi(value);
              setCurrentPage(1);
            }}
            disabled={!selectedFirma || selectedFirma === "all"}
          >
            <SelectTrigger>
              <SelectValue placeholder={selectedFirma === "all" ? "Önce firma seçin" : "Bayi Seç"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Bayiler</SelectItem>
              {branchesResponse?.data
                ?.filter(branch => !selectedFirma || selectedFirma === "all" || branch.firma === parseInt(selectedFirma))
                .map((branch) => (
                  <SelectItem key={branch.id} value={branch.id.toString()}>
                    {branch.ad}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Button
            onClick={() => {
              setSelectedUser(null);
              setIsEditDialogOpen(true);
            }}
            className="w-full sm:w-auto whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            Program Kullanıcı Ekle
          </Button>
        </div>

      </div>

      {/* Tablo */}
      <div className="border-t sm:border rounded-none sm:rounded-lg overflow-hidden mt-2 sm:mt-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[35px] px-1 py-2 text-center">#</TableHead>
                <TableHead className="px-1 py-2">Ad</TableHead>
                <TableHead className="hidden sm:table-cell">MAC Adresi</TableHead>
                <TableHead className="hidden sm:table-cell">Firma</TableHead>
                <TableHead className="hidden sm:table-cell">Bayi</TableHead>
                <TableHead className="hidden sm:table-cell">İlk Giriş</TableHead>
                <TableHead className="w-[60px] px-1 py-2 text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    {[...Array(7)].map((_, cellIndex) => (
                      <TableCell key={cellIndex} className="px-1 py-2">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : users.length > 0 ? (
                users.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell className="text-center px-1 py-2">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell className="px-1 py-2">
                      <div className="flex flex-col">
                        <div className="font-medium truncate" title={user.isim}>
                          {user.isim}
                        </div>
                        <div className="text-xs text-muted-foreground truncate sm:hidden">
                          {user.firma_name || "-"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell px-1 py-2">
                      <div className="truncate" title={user.macAdress}>
                        {user.macAdress}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell px-1 py-2">
                      {user.firma_name || "-"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell px-1 py-2">
                      {user.bayi_name || "-"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell px-1 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          user.firstlogin === 0
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {user.firstlogin === 0 ? "Yapılmadı" : "Yapıldı"}
                      </span>
                    </TableCell>
                    <TableCell className="p-0">
                      <div className="flex justify-end gap-0.5 px-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                          <span className="sr-only">Düzenle</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => deleteUserMutation.mutate(user.id)}
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
                  <TableCell colSpan={7} className="h-24 text-center">
                    {searchTerm || selectedFirma !== "all" || selectedBayi !== "all"
                      ? "Arama kriterlerine uygun program kullanıcısı bulunamadı."
                      : "Program kullanıcısı bulunamadı."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {users.length > 0 && pagination && (
        <div className="mt-3 p-2 sm:mt-4 sm:p-0">
          <TablePagination
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            onPageChange={setCurrentPage}
            totalItems={pagination.total}
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}

      {/* Dialog */}
      <ProgramUserEditDialog
        user={selectedUser}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </div>
  );
}