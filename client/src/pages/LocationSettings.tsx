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
import { Plus, Trash2, ChevronLeft, ChevronRight, Loader2, Edit, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// Types
interface Ulke {
  id: number;
  ulke_adi: string;
  ulke_kodu: string;
  telefon_kodu: string;
}

interface Il {
  id: number;
  il: string;
  ulke_id: number;
}

interface Ilce {
  id: number;
  ilce: string;
  il_id: number;
}

// Form schemas
const ulkeSchema = z.object({
  ulke_adi: z.string().min(1, "Ülke adı gereklidir"),
});

const ilSchema = z.object({
  il: z.string().min(1, "İl adı gereklidir"),
  ulke_id: z.number().min(1, "Ülke seçimi gereklidir"),
});

const ilceSchema = z.object({
  ilce: z.string().min(1, "İlçe adı gereklidir"),
  il_id: z.number().min(1, "İl seçimi gereklidir"),
});

// API functions
const fetchUlkeler = async (): Promise<Ulke[]> => {
  const response = await fetch("/api/ulkeler");
  if (!response.ok) throw new Error("Ülkeler yüklenemedi");
  const result = await response.json();
  return result.data;
};

const fetchIller = async (ulkeId: number): Promise<Il[]> => {
  const response = await fetch(`/api/ulkeler/${ulkeId}/iller`);
  if (!response.ok) throw new Error("İller yüklenemedi");
  const result = await response.json();
  return result.data;
};

const fetchIlceler = async (ulkeId: number, ilId: number): Promise<Ilce[]> => {
  const response = await fetch(`/api/ulkeler/${ulkeId}/iller/${ilId}/ilceler`);
  if (!response.ok) throw new Error("İlçeler yüklenemedi");
  const result = await response.json();
  return result.data;
};

const createIl = async (data: { il: string; ulke_id: number }) => {
  const response = await fetch("/api/il", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("İl eklenemedi");
  return response.json();
};

const createIlce = async (data: { ilce: string; il_id: number }) => {
  const response = await fetch("/api/ilce", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("İlçe eklenemedi");
  return response.json();
};

const deleteIlce = async (id: number) => {
  const response = await fetch(`/api/ilce/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("İlçe silinemedi");
  return response.json();
};

const deleteIl = async (id: number) => {
  const response = await fetch(`/api/ulkeler/iller/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("İl silinemedi");
  return response.json();
};

const deleteIlceNew = async (ilId: number, ilceId: number) => {
  const response = await fetch(`/api/ulkeler/iller/${ilId}/ilceler/${ilceId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("İlçe silinemedi");
  return response.json();
};

const updateIl = async (id: number, data: { il: string }) => {
  const response = await fetch(`/api/ulkeler/iller/${id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("İl güncellenemedi");
  return response.json();
};

const updateIlce = async (ilId: number, ilceId: number, data: { ilce: string }) => {
  const response = await fetch(`/api/ulkeler/iller/${ilId}/ilceler/${ilceId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("İlçe güncellenemedi");
  return response.json();
};

export default function LocationSettings() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [selectedUlke, setSelectedUlke] = useState<Ulke | null>(null);
  const [selectedIl, setSelectedIl] = useState<Il | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isIlDialogOpen, setIsIlDialogOpen] = useState(false);
  const [isIlceDialogOpen, setIsIlceDialogOpen] = useState(false);
  const [ilceToDelete, setIlceToDelete] = useState<Ilce | null>(null);
  const [ilToDelete, setIlToDelete] = useState<Il | null>(null);
  const [editingIl, setEditingIl] = useState<Il | null>(null);
  const [editingIlce, setEditingIlce] = useState<Ilce | null>(null);

  // Queries
  const { data: ulkeler = [], isLoading: ulkelerLoading } = useQuery({
    queryKey: ["ulkeler"],
    queryFn: fetchUlkeler,
  });

  const { data: iller = [], isLoading: illerLoading } = useQuery({
    queryKey: ["iller", selectedUlke?.id],
    queryFn: () => selectedUlke ? fetchIller(selectedUlke.id) : Promise.resolve([]),
    enabled: !!selectedUlke,
  });

  const { data: ilceler = [], isLoading: ilcelerLoading } = useQuery({
    queryKey: ["ilceler", selectedUlke?.id, selectedIl?.id],
    queryFn: () => selectedUlke && selectedIl ? fetchIlceler(selectedUlke.id, selectedIl.id) : Promise.resolve([]),
    enabled: !!selectedUlke && !!selectedIl,
  });

  // Forms
  const ilForm = useForm<z.infer<typeof ilSchema>>({
    resolver: zodResolver(ilSchema),
    defaultValues: {
      il: "",
      ulke_id: selectedUlke?.id || 0,
    },
  });

  const ilceForm = useForm<z.infer<typeof ilceSchema>>({
    resolver: zodResolver(ilceSchema),
    defaultValues: {
      ilce: "",
      il_id: selectedIl?.id || 0,
    },
  });

  // Update form defaults when selections change
  useEffect(() => {
    ilForm.setValue("ulke_id", selectedUlke?.id || 0);
  }, [selectedUlke, ilForm]);

  useEffect(() => {
    ilceForm.setValue("il_id", selectedIl?.id || 0);
  }, [selectedIl, ilceForm]);

  // Mutations
  const createIlMutation = useMutation({
    mutationFn: createIl,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iller", selectedUlke?.id] });
      toast({
        title: t('success'),
        description: t('province-added-successfully'),
      });
      setIsIlDialogOpen(false);
      ilForm.reset();
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('error-adding-province'),
        variant: "destructive",
      });
    },
  });

  const createIlceMutation = useMutation({
    mutationFn: createIlce,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ilceler", selectedUlke?.id, selectedIl?.id] });
      toast({
        title: t('success'),
        description: t('district-added-successfully'),
      });
      setIsIlceDialogOpen(false);
      ilceForm.reset();
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('error-adding-district'),
        variant: "destructive",
      });
    },
  });

  const deleteIlceMutation = useMutation({
    mutationFn: deleteIlce,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ilceler", selectedUlke?.id, selectedIl?.id] });
      toast({
        title: t('success'),
        description: t('district-deleted-successfully'),
      });
      setIlceToDelete(null);
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('error-deleting-district'),
        variant: "destructive",
      });
    },
  });

  const deleteIlMutation = useMutation({
    mutationFn: deleteIl,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iller", selectedUlke?.id] });
      toast({
        title: t('success'),
        description: t('province-deleted-successfully'),
      });
      setIlToDelete(null);
      setSelectedIl(null);
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('error-deleting-province'),
        variant: "destructive",
      });
    },
  });

  const deleteIlceNewMutation = useMutation({
    mutationFn: ({ ilId, ilceId }: { ilId: number; ilceId: number }) => deleteIlceNew(ilId, ilceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ilceler", selectedUlke?.id, selectedIl?.id] });
      toast({
        title: t('success'),
        description: t('district-deleted-successfully'),
      });
      setIlceToDelete(null);
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('error-deleting-district'),
        variant: "destructive",
      });
    },
  });

  const updateIlMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { il: string } }) => updateIl(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iller", selectedUlke?.id] });
      toast({
        title: t('success'),
        description: t('province-updated-successfully'),
      });
      setEditingIl(null);
      setIsIlDialogOpen(false);
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('error-updating-province'),
        variant: "destructive",
      });
    },
  });

  const updateIlceMutation = useMutation({
    mutationFn: ({ ilId, ilceId, data }: { ilId: number; ilceId: number; data: { ilce: string } }) => updateIlce(ilId, ilceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ilceler", selectedUlke?.id, selectedIl?.id] });
      toast({
        title: t('success'),
        description: t('district-updated-successfully'),
      });
      setEditingIlce(null);
      setIsIlceDialogOpen(false);
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('error-updating-district'),
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleIlSubmit = (data: z.infer<typeof ilSchema>) => {
    createIlMutation.mutate(data);
  };

  const handleIlceSubmit = (data: z.infer<typeof ilceSchema>) => {
    createIlceMutation.mutate(data);
  };

  const handleDeleteIlce = () => {
    if (ilceToDelete && selectedIl) {
      deleteIlceNewMutation.mutate({ ilId: selectedIl.id, ilceId: ilceToDelete.id });
    }
  };

  const handleDeleteIl = () => {
    if (ilToDelete) {
      deleteIlMutation.mutate(ilToDelete.id);
    }
  };

  const handleUpdateIl = (data: z.infer<typeof ilSchema>) => {
    if (editingIl) {
      updateIlMutation.mutate({ id: editingIl.id, data });
    }
  };

  const handleUpdateIlce = (data: z.infer<typeof ilceSchema>) => {
    if (editingIlce && selectedIl) {
      updateIlceMutation.mutate({ ilId: selectedIl.id, ilceId: editingIlce.id, data });
    }
  };

  // Form'ları düzenleme modunda doldur
  useEffect(() => {
    if (editingIl) {
      ilForm.setValue("il", editingIl.il);
    }
  }, [editingIl, ilForm]);

  useEffect(() => {
    if (editingIlce) {
      ilceForm.setValue("ilce", editingIlce.ilce);
    }
  }, [editingIlce, ilceForm]);

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(ilceler.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentIlceler = ilceler.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Ülkeler */}
      <Card>
        <CardHeader>
          <CardTitle>{t('country')}</CardTitle>
          <CardDescription>{t('manage-registered-countries')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select
              value={selectedUlke?.id.toString() || ""}
              onValueChange={(value) => {
                const ulke = ulkeler.find(u => u.id === parseInt(value));
                setSelectedUlke(ulke || null);
                setSelectedIl(null);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('select-country')} />
              </SelectTrigger>
              <SelectContent>
                {ulkeler.map((ulke) => (
                  <SelectItem key={ulke.id} value={ulke.id.toString()}>
                    {ulke.ulke_adi}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* İller */}
      {selectedUlke && (
        <Card>
          <CardHeader>
            <CardTitle>{t('province')}</CardTitle>
            <CardDescription>
              {selectedUlke.ulke_adi} {t('province')} {t('district')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                {!editingIl && (
                  <Button
                    onClick={() => setIsIlDialogOpen(true)}
                    disabled={!selectedUlke}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('add-province')}
                  </Button>
                )}
              </div>

              {illerLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-2">
                  {iller.map((il) => (
                    <div
                      key={il.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => {
                          setSelectedIl(il);
                          setCurrentPage(1);
                        }}
                      >
                        <span className="font-medium">{il.il}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingIl(il);
                            setIsIlDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIlToDelete(il);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedIl(il);
                            setCurrentPage(1);
                          }}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* İlçeler */}
      {selectedUlke && selectedIl && (
        <Card>
          <CardHeader>
            <CardTitle>{t('district')}</CardTitle>
            <CardDescription>
              {selectedIl.il} {t('district')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                {!editingIlce && (
                  <Button
                    onClick={() => setIsIlceDialogOpen(true)}
                    disabled={!selectedIl}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('add-district')}
                  </Button>
                )}
              </div>

              {ilcelerLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : ilceler.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {t('no-districts-found')}
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('district-name')}</TableHead>
                        <TableHead className="w-[100px]">{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentIlceler.map((ilce) => (
                        <TableRow key={ilce.id}>
                          <TableCell>{ilce.ilce}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingIlce(ilce);
                                  setIsIlceDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setIlceToDelete(ilce)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        {t('total')} {ilceler.length} {t('records')}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          {t('previous')}
                        </Button>
                        <span className="text-sm">
                          {currentPage} / {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                        >
                          {t('next')}
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* İl Ekleme Dialog */}
      <Dialog open={isIlDialogOpen} onOpenChange={(open) => {
        setIsIlDialogOpen(open);
        if (!open) {
          setEditingIl(null);
          ilForm.reset();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingIl ? t('edit-province') : t('add-province')}</DialogTitle>
          </DialogHeader>
          <Form {...ilForm}>
            <form onSubmit={ilForm.handleSubmit(editingIl ? handleUpdateIl : handleIlSubmit)} className="space-y-4">
              <FormField
                control={ilForm.control}
                name="il"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('province-name')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('enter-province-name')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsIlDialogOpen(false);
                  setEditingIl(null);
                  ilForm.reset();
                }}
              >
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={createIlMutation.isPending || updateIlMutation.isPending}>
                {(createIlMutation.isPending || updateIlMutation.isPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {editingIl ? t('update-province') : t('add-province')}
              </Button>
            </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* İlçe Ekleme Dialog */}
      <Dialog open={isIlceDialogOpen} onOpenChange={(open) => {
        setIsIlceDialogOpen(open);
        if (!open) {
          setEditingIlce(null);
          ilceForm.reset();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingIlce ? t('edit-district') : t('add-district')}</DialogTitle>
          </DialogHeader>
          <Form {...ilceForm}>
            <form onSubmit={ilceForm.handleSubmit(editingIlce ? handleUpdateIlce : handleIlceSubmit)} className="space-y-4">
              <FormField
                control={ilceForm.control}
                name="ilce"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('district-name')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('enter-district-name')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsIlceDialogOpen(false);
                  setEditingIlce(null);
                  ilceForm.reset();
                }}
              >
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={createIlceMutation.isPending || updateIlceMutation.isPending}>
                {(createIlceMutation.isPending || updateIlceMutation.isPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {editingIlce ? t('update-district') : t('add-district')}
              </Button>
            </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* İlçe Silme Dialog */}
      <AlertDialog open={!!ilceToDelete} onOpenChange={() => setIlceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete-district')}</AlertDialogTitle>
            <AlertDialogDescription>
              {ilceToDelete?.ilce} {t('are-you-sure-delete-district')} {t('this-action-cannot-be-undone')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteIlce}
              disabled={deleteIlceNewMutation.isPending}
            >
              {deleteIlceNewMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* İl Silme Dialog */}
      <AlertDialog open={!!ilToDelete} onOpenChange={() => setIlToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete-province')}</AlertDialogTitle>
            <AlertDialogDescription>
              {ilToDelete?.il} {t('are-you-sure-delete-province')} {t('this-action-cannot-be-undone')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteIl}
              disabled={deleteIlMutation.isPending}
            >
              {deleteIlMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}