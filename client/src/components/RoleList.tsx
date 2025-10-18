import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RoleDialog } from "./RoleDialog";
import { useLanguage } from "@/contexts/LanguageContext";

interface Role {
  id: number;
  name: string;
  slug: string;
  permissions: string;
  created_at: string;
  updated_at: string;
  description: string | null;
}

interface RolesResponse {
  success: boolean;
  data: Role[];
  count: number;
}

export function RoleList() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const itemsPerPage = 10;

  const { data: response, isLoading, error } = useQuery<RolesResponse>({
    queryKey: ["/api/roles"],
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/roles/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({
        title: t('success'),
        description: t('role-successfully-deleted'),
      });
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: `${t('error-deleting-role')}: ${error}`,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-muted-foreground">{t('loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-red-500">{t('error')}: {(error as Error).message}</div>
      </div>
    );
  }

  const roles = response?.data || [];
  const totalRecords = roles.length;
  const totalPages = Math.ceil(totalRecords / itemsPerPage);

  // Get paginated data
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRoles = roles.slice(startIndex, startIndex + itemsPerPage);

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 pb-4 px-6">
        <div>
          <CardTitle>{t('roles')}</CardTitle>
          <CardDescription>
            {t('manage-user-roles-and-permissions')}
          </CardDescription>
        </div>
        <RoleDialog />
      </CardHeader>
      <CardContent className="px-6">
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('role-name')}</TableHead>
                <TableHead className="hidden sm:table-cell">{t('creation-date')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {new Date(role.created_at).toLocaleDateString("tr-TR")}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        setEditingRole(role);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">{t('edit')}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        if (
                          confirm(t('are-you-sure-delete-role'))
                        ) {
                          deleteRoleMutation.mutate(role.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span className="sr-only">{t('delete')}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalRecords > 0 && (
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                {t('total')} {totalRecords} {t('records')} ({(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalRecords)} {t('range')})
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
          )}
        </div>
      </CardContent>
      {editingRole && (
        <RoleDialog
          role={editingRole}
          onClose={() => setEditingRole(null)}
        />
      )}
    </Card>
  );
}