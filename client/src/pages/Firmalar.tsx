import { Card } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
import { useState } from "react";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { CompanyDialog } from "@/components/CompanyDialog";
import { CompanyEditDialog } from "@/components/CompanyEditDialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface Company {
  id: number;
  name: string;
  firma_unvan: string;
  email: string;
  telefon: string;
  adres: string;
  vergi_dairesi: string;
  vergi_no: string;
  tc_no: string;
  iban: string;
  durum: string;
  test_sayisi: number;
  superadmin_oran: number;
  bakiye: number;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  success: boolean;
  data: Company[];
  count: number;
}

export default function FirmalarPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState<"firma_unvan" | "vergi_no">("firma_unvan");
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [deleteCompanyId, setDeleteCompanyId] = useState<number | null>(null);
  const itemsPerPage = 25;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: response, isLoading, isError, error } = useQuery<ApiResponse>({
    queryKey: ["/api/companies"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/companies/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(t('error-deleting-company'));
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({
        title: t('success'),
        description: t('company-deleted-successfully'),
      });
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-lg text-muted-foreground">{t('loading')}</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-lg text-red-500">
          {t('error-loading-data')}: {(error as Error).message}
        </div>
      </div>
    );
  }

  const companies = response?.data || [];

  const filteredCompanies = companies.filter((company) => {
    const searchTerm = search.toLowerCase();
    const searchField = filterBy === "firma_unvan" ? company.firma_unvan : company.vergi_no;
    return searchField.toLowerCase().includes(searchTerm);
  });

  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-2 px-4 sm:px-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('companies')}</h1>
            <p className="text-muted-foreground">{t('companies-description')}</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> {t('add-company')}
          </Button>
        </div>
      </div>

      <div className="mt-8 px-4 sm:px-6">
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-48">
                <Select
                  value={filterBy}
                  onValueChange={(value: "firma_unvan" | "vergi_no") => setFilterBy(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('select-filter')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="firma_unvan">{t('company-title')}</SelectItem>
                    <SelectItem value="vergi_no">{t('tax-number')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:flex-1">
                <Input
                  placeholder={
                    filterBy === "firma_unvan"
                      ? t('search-by-company-title')
                      : t('search-by-tax-number')
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="-mx-4 sm:mx-0 overflow-x-auto">
              <div className="min-w-full inline-block align-middle">
                <div className="overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">{t('no')}</TableHead>
                        <TableHead className="whitespace-nowrap">{t('company-name')}</TableHead>
                        <TableHead className="whitespace-nowrap">{t('company-title')}</TableHead>
                        <TableHead className="hidden md:table-cell whitespace-nowrap">{t('email')}</TableHead>
                        <TableHead className="hidden sm:table-cell whitespace-nowrap">{t('phone')}</TableHead>
                        <TableHead className="hidden lg:table-cell whitespace-nowrap">{t('tax-number')}</TableHead>
                        <TableHead className="whitespace-nowrap">{t('status')}</TableHead>
                        <TableHead className="hidden md:table-cell whitespace-nowrap">{t('created-at')}</TableHead>
                        <TableHead className="text-right">{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedCompanies.map((company, index) => (
                        <TableRow key={company.id}>
                          <TableCell>{((currentPage - 1) * itemsPerPage) + index + 1}</TableCell>
                          <TableCell className="max-w-[100px] sm:max-w-[150px]">
                            <div className="truncate" title={company.name}>{company.name}</div>
                          </TableCell>
                          <TableCell className="max-w-[120px] sm:max-w-[200px]">
                            <div className="truncate" title={company.firma_unvan}>{company.firma_unvan}</div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell max-w-[150px] lg:max-w-[200px]">
                            <div className="truncate" title={company.email}>{company.email}</div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell whitespace-nowrap">
                            {company.telefon}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell whitespace-nowrap">
                            {company.vergi_no}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                                company.durum === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {company.durum === "active" ? t('active') : t('inactive')}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell whitespace-nowrap">
                            {format(new Date(company.created_at), "dd.MM.yyyy")}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedCompany(company)}
                                className="h-8 w-8"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteCompanyId(company.id)}
                                className="h-8 w-8 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                {t('total')} {filteredCompanies.length} {t('records')} ({(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredCompanies.length)} {t('range')})
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
                    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                      if (i === 1 || i === totalPages) continue;
                      pageNumbers.push(addPageButton(i));
                    }

                    if (currentPage < totalPages - 2) {
                      pageNumbers.push(
                        <span key="ellipsis-2" className="px-2">
                          ...
                        </span>
                      );
                    }

                    // Always add last page if there is more than one page
                    if (totalPages > 1) {
                      pageNumbers.push(addPageButton(totalPages));
                    }

                    return pageNumbers;
                  })()}
                </div>
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

          </div>
        </Card>
      </div>

      <CompanyDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <CompanyEditDialog
        open={selectedCompany !== null}
        onOpenChange={(open) => !open && setSelectedCompany(null)}
        company={selectedCompany}
      />

      <AlertDialog
        open={deleteCompanyId !== null}
        onOpenChange={(open) => !open && setDeleteCompanyId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete-company')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete-company-confirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteCompanyId) {
                  deleteMutation.mutate(deleteCompanyId);
                  setDeleteCompanyId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? t('deleting') : t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}