import { useEffect, useState, useCallback } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Trash2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// Form şemaları
const ilSchema = z.object({
  il: z.string().min(1, "Province name is required"),
});

const ilceSchema = z.object({
  ilce: z.string().min(1, "District name is required"),
  il_id: z.string().min(1, "Province selection is required"),
});

type Il = {
  id: number;
  il: string;
  ilceler: { id: number; ilce: string }[];
};

export default function LocationSettings() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedIl, setSelectedIl] = useState<Il | null>(null);
  const [isIlDialogOpen, setIsIlDialogOpen] = useState(false);
  const [isIlceDialogOpen, setIsIlceDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [ilceCurrentPage, setIlceCurrentPage] = useState(1);
  const [ilceToDelete, setIlceToDelete] = useState<{ id: number; ilce: string } | null>(null);
  const itemsPerPage = 10;
  const ilceItemsPerPage = 10;

  const ilForm = useForm<z.infer<typeof ilSchema>>({
    resolver: zodResolver(ilSchema),
    defaultValues: {
      il: "",
    },
  });

  const ilceForm = useForm<z.infer<typeof ilceSchema>>({
    resolver: zodResolver(ilceSchema),
    defaultValues: {
      ilce: "",
      il_id: "",
    },
  });

  // İlçe dialog'u açıldığında form değerlerini güncelle
  useEffect(() => {
    if (isIlceDialogOpen && selectedIl) {
      ilceForm.setValue("il_id", selectedIl.id.toString());
    }
  }, [isIlceDialogOpen, selectedIl, ilceForm]);

  // Veri sorgulama optimizasyonu
  const { data: locationResponse, isLoading } = useQuery<{success: boolean, data: Il[]}>({
    queryKey: ["/api/il-ilce"],
    staleTime: 5000, // 5 saniye cache
    cacheTime: 10 * 60 * 1000, // 10 dakika cache
  });

  const locations = locationResponse?.data || [];

  // Il mutasyonları
  const createIlMutation = useMutation({
    mutationFn: async (data: { il: string }) => {
      const response = await fetch("/api/il", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(t('error-adding-province'));
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/il-ilce"] });
      toast({ title: t('success'), description: t('province-added-successfully') });
      setIsIlDialogOpen(false);
      ilForm.reset();
    },
  });

  // İlçe mutasyonları optimizasyonu
  const createIlceMutation = useMutation({
    mutationFn: async (data: { ilce: string; il_id: string }) => {
      const response = await fetch("/api/ilce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || t('error-adding-district'));
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Hemen UI'ı güncelle
      queryClient.setQueryData<{success: boolean, data: Il[]}>(["/api/il-ilce"], (oldData) => {
        if (!oldData) return oldData;

        const newData = {
          ...oldData,
          data: oldData.data.map(il => {
            if (il.id === parseInt(variables.il_id)) {
              const updatedIl = {
                ...il,
                ilceler: [
                  ...il.ilceler,
                  {
                    id: Date.now(),
                    ilce: variables.ilce
                  }
                ]
              };
              // selectedIl'i güncelle
              if (selectedIl?.id === il.id) {
                setSelectedIl(updatedIl);
              }
              return updatedIl;
            }
            return il;
          })
        };
        return newData;
      });

      // Hemen toast göster ve formu kapat
      toast({ title: t('success'), description: t('district-added-successfully') });
      setIsIlceDialogOpen(false);
      ilceForm.reset({ il_id: selectedIl?.id.toString() || "", ilce: "" });

      // Arkaplanda verileri güncelle
      queryClient.invalidateQueries({ queryKey: ["/api/il-ilce"] });
    },
    onError: (error) => {
      console.error("İlçe ekleme hatası:", error);
      toast({ 
        title: t('error'), 
        description: error instanceof Error ? error.message : t('error-adding-district'),
        variant: "destructive"
      });
    }
  });

  // Form submit handler'ı debounce et
  const onIlceSubmit = useCallback(async (data: z.infer<typeof ilceSchema>) => {
    if (createIlceMutation.isPending) return;
    createIlceMutation.mutate(data);
  }, [createIlceMutation]);

  const deleteIlceMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/ilce/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(t('error-deleting-district'));
      return response.json();
    },
    onSuccess: (_, deletedId) => {
      // Optimistik güncelleme
      queryClient.setQueryData<{success: boolean, data: Il[]}>(["/api/il-ilce"], (oldData) => {
        if (!oldData) return oldData;

        const newData = {
          ...oldData,
          data: oldData.data.map(il => {
            if (il.id === selectedIl?.id) {
              const updatedIl = {
                ...il,
                ilceler: il.ilceler.filter(ilce => ilce.id !== deletedId)
              };
              // selectedIl'i güncelle
              setSelectedIl(updatedIl);
              return updatedIl;
            }
            return il;
          })
        };
        return newData;
      });

      toast({ title: t('success'), description: t('district-deleted-successfully') });
      setIlceToDelete(null);

      // Arkaplanda verileri güncelle
      queryClient.invalidateQueries({ queryKey: ["/api/il-ilce"] });
    },
    onError: (error) => {
      console.error("İlçe silme hatası:", error);
      toast({ 
        title: t('error'), 
        description: error instanceof Error ? error.message : t('error-deleting-district'),
        variant: "destructive"
      });
      setIlceToDelete(null);
    }
  });

  // İl sayfalama için veri hazırlama
  const totalPages = Math.ceil(locations.length / itemsPerPage);
  const paginatedLocations = locations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // İlçe sayfalama için veri hazırlama
  const totalIlcePages = Math.ceil((selectedIl?.ilceler.length || 0) / ilceItemsPerPage);
  const paginatedIlceler = selectedIl?.ilceler.slice(
    (ilceCurrentPage - 1) * ilceItemsPerPage,
    ilceCurrentPage * ilceItemsPerPage
  ) || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* İl Yönetimi */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>{t('province')}</CardTitle>
              <CardDescription>
                {t('manage-registered-provinces')}
              </CardDescription>
            </div>
            <Dialog open={isIlDialogOpen} onOpenChange={setIsIlDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t('add-province')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('add-province')}</DialogTitle>
                </DialogHeader>
                <Form {...ilForm}>
                  <form onSubmit={ilForm.handleSubmit((data) => createIlMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={ilForm.control}
                      name="il"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('province-name')}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={t('enter-province-name')} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end">
                      <Button type="submit">{t('add-province')}</Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('province-name')}</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLocations.map((il) => (
                  <TableRow key={il.id} onClick={() => setSelectedIl(il)} className="cursor-pointer">
                    <TableCell>{il.il}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteIlMutation.mutate(il.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* İl Sayfalama Kontrolleri */}
            <div className="mt-4 border-t">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
                <div className="text-sm text-muted-foreground order-2 sm:order-1">
                  {t('total')} {locations.length} {t('records')}
                  {locations.length > 0 && (
                    <span className="hidden sm:inline">
                      {" "}({(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, locations.length)} {t('range')})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1 min-w-[90px] justify-center">
                    <span className="text-sm font-medium">{currentPage}</span>
                    <span className="text-sm text-muted-foreground">/ {totalPages || 1}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* İlçe Yönetimi */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>{t('district')}</CardTitle>
              <CardDescription>
                {selectedIl ? `${selectedIl.il} ${t('province')} ${t('district')}` : t('select-province')}
              </CardDescription>
            </div>
            <Dialog 
              open={isIlceDialogOpen} 
              onOpenChange={(open) => {
                setIsIlceDialogOpen(open);
                if (!open) {
                  ilceForm.reset({ il_id: selectedIl?.id.toString() || "", ilce: "" });
                }
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2" disabled={!selectedIl}>
                  <Plus className="h-4 w-4" />
                  {t('add-district')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('add-district')}</DialogTitle>
                </DialogHeader>
                <Form {...ilceForm}>
                  <form onSubmit={ilceForm.handleSubmit(onIlceSubmit)} className="space-y-4">
                    <FormField
                      control={ilceForm.control}
                      name="il_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('province')}</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={selectedIl?.id.toString()}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('select-province')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {locations?.map((il) => (
                                <SelectItem key={il.id} value={il.id.toString()}>
                                  {il.il}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={ilceForm.control}
                      name="ilce"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('district-name')}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={t('enter-district-name')} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={createIlceMutation.isPending}
                      >
                        {createIlceMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('loading')}
                          </>
                        ) : (
                          t('add-district')
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('district-name')}</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedIlceler.map((ilce) => (
                  <TableRow key={ilce.id}>
                    <TableCell>{ilce.ilce}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIlceToDelete(ilce)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!selectedIl && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      {t('select-province')}
                    </TableCell>
                  </TableRow>
                )}
                {selectedIl && paginatedIlceler.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      {t('no-districts-found')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* İlçe Sayfalama Kontrolleri */}
            {selectedIl && selectedIl.ilceler.length > 0 && (
              <div className="mt-4 border-t">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
                  <div className="text-sm text-muted-foreground order-2 sm:order-1">
                    {t('total')} {selectedIl.ilceler.length} {t('records')}
                    <span className="hidden sm:inline">
                      {" "}({(ilceCurrentPage - 1) * ilceItemsPerPage + 1} - {Math.min(ilceCurrentPage * ilceItemsPerPage, selectedIl.ilceler.length)} {t('range')})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 order-1 sm:order-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setIlceCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={ilceCurrentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1 min-w-[90px] justify-center">
                      <span className="text-sm font-medium">{ilceCurrentPage}</span>
                      <span className="text-sm text-muted-foreground">/ {totalIlcePages || 1}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setIlceCurrentPage((prev) => Math.min(totalIlcePages, prev + 1))}
                      disabled={ilceCurrentPage === totalIlcePages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* İlçe Silme Onay Dialog'u */}
      <AlertDialog 
        open={!!ilceToDelete} 
        onOpenChange={(open) => !open && setIlceToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete-district')}</AlertDialogTitle>
            <AlertDialogDescription>
              {ilceToDelete?.ilce} {t('are-you-sure-delete-district')}
              {t('this-action-cannot-be-undone')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => ilceToDelete && deleteIlceMutation.mutate(ilceToDelete.id)}
            >
              {deleteIlceMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('loading')}
                </>
              ) : (
                t('delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}