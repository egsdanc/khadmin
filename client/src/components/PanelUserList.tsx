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
import { PlusCircle, Pencil, Trash2, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { PanelUserEditDialog } from "./PanelUserEditDialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";


interface PanelUser {
  id: number;
  name: string;
  lastname?: string;
  full_name?: string;
  email: string;
  firma_id: number | null;
  firma_name: string | null;
  firma_unvan: string | null;
  bayi_id: number | null;
  bayi_name: string | null;
  role: string;
  status: string;
  language_preference: string;
}

interface ApiResponse {
  success: boolean;
  data: PanelUser[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

export default function PanelUserList() {
  const { t } = useLanguage();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<PanelUser | null>(null);
  const [formData, setFormData] = useState({
    role: "all",
    status: "all",
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const itemsPerPage = 10;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchInput);
      setCurrentPage(1); // Reset to first page when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: response, isLoading } = useQuery<ApiResponse>({
    queryKey: ["/api/panel-users", currentPage, itemsPerPage, debouncedSearchTerm, formData.role, formData.status],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
        ...(formData.role !== "all" && { role: formData.role }),
        ...(formData.status !== "all" && { status: formData.status }),
      });

      console.log('Frontend: API isteği gönderiliyor:', Object.fromEntries(params));

      const response = await fetch(`/api/panel-users?${params}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(t('api-request-failed'));
      }

      const data = await response.json();
      console.log('Frontend: API yanıtı:', data);
      return data;
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/panel-users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/panel-users"] });
      toast({
        title: t('success'),
        description: t('user-deleted-successfully'),
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('error-deleting-user'),
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-4">
      {/* Filtreleme alanı */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex gap-2 col-span-1 sm:col-span-2">
          <Input
            placeholder={t('search-by-name-or-email')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1"
          />
        </div>
        <div className="col-span-1">
          <Select
            value={formData.role}
            onValueChange={(value) => {
              setFormData((prev) => ({ ...prev, role: value }));
              setCurrentPage(1); // Reset page when filter changes
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('select-role')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all-roles')}</SelectItem>
              <SelectItem value="Super Admin">Super Admin</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Bayi">Bayi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-1">
          <Select
            value={formData.status}
            onValueChange={(value) => {
              setFormData((prev) => ({ ...prev, status: value }));
              setCurrentPage(1); // Reset page when filter changes
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('select-status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all')}</SelectItem>
              <SelectItem value="active">{t('active')}</SelectItem>
              <SelectItem value="inactive">{t('inactive')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-1 sm:col-span-2 lg:col-span-1">
          <Button
            onClick={() => {
              setSelectedUser(null);
              setIsEditDialogOpen(true);
            }}
            className="w-full sm:w-auto justify-center"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            {t('add-user')}
          </Button>
        </div>
      </div>

      {/* Tablo */}
      <div className="rounded-md border">
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-50">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">{t('no')}</TableHead>
                <TableHead>{t('name')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('email')}</TableHead>
                <TableHead className="hidden lg:table-cell">{t('company')}</TableHead>
                <TableHead className="hidden xl:table-cell">{t('dealer')}</TableHead>
                <TableHead>{t('role')}</TableHead>
                <TableHead className="hidden sm:table-cell">{t('status')}</TableHead>
                <TableHead className="hidden lg:table-cell">{t('language')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {response?.data && response.data.length > 0 ? (
                response.data.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell className="max-w-[120px] sm:max-w-[200px]">
                      <div className="truncate" title={user.full_name || `${user.name} ${user.lastname || ''}`.trim()}>
                        {user.full_name || `${user.name} ${user.lastname || ''}`.trim()}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-[200px]">
                      <div className="truncate" title={user.email}>
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell max-w-[150px]">
                      <div className="truncate" title={user.firma_name || "-"}>
                        {user.firma_name || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell max-w-[150px]">
                      <div className="truncate" title={user.bayi_name || "-"}>
                        {user.bayi_name || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                          user.role === "Super Admin"
                            ? "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-700/10"
                            : user.role === "Admin"
                            ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10"
                            : "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                        }`}
                      >
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                          user.status === "active"
                            ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                            : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                        }`}
                      >
                        {user.status === "active" ? t('active') : t('inactive')}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20">
                        {(user.language_preference || 'tr') === 'en' ? '🇺🇸 English' : '🇹🇷 Türkçe'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setSelectedUser(user);
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
                            setSelectedUser(user);
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
                  <TableCell colSpan={8} className="h-24 text-center">
                    {debouncedSearchTerm ||
                    formData.role !== "all" ||
                    formData.status !== "all"
                      ? t('no-users-found-matching-criteria')
                      : t('no-users-found')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination section */}
        {response?.data && response.data.length > 0 && response.pagination && (
          <div className="flex items-center justify-between p-4 border-t">
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
              <div className="flex items-center gap-1">
                {(() => {
                  const pageNumbers = [];
                  const addPageButton = (pageNum: number) => (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "ghost"}
                      size="sm"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );

                  // Always add first page
                  pageNumbers.push(addPageButton(1));

                  if (currentPage > 3) {
                    pageNumbers.push(
                      <span key="ellipsis-1" className="px-2">
                        ...
                      </span>
                    );
                  }

                  // Add pages around current page
                  for (let i = Math.max(2, currentPage - 1); i <= Math.min(response.pagination.totalPages - 1, currentPage + 1); i++) {
                    if (i === 1 || i === response.pagination.totalPages) continue;
                    pageNumbers.push(addPageButton(i));
                  }

                  if (currentPage < response.pagination.totalPages - 2) {
                    pageNumbers.push(
                      <span key="ellipsis-2" className="px-2">
                        ...
                      </span>
                    );
                  }

                  // Always add last page if there is more than one page
                  if (response.pagination.totalPages > 1) {
                    pageNumbers.push(addPageButton(response.pagination.totalPages));
                  }

                  return pageNumbers;
                })()}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(response.pagination.totalPages, prev + 1))}
                disabled={currentPage === response.pagination.totalPages}
              >
                {t('next')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialoglar */}
      <PanelUserEditDialog
        user={selectedUser}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete-user')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete-user-confirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (selectedUser) {
                  deleteUserMutation.mutate(selectedUser.id);
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