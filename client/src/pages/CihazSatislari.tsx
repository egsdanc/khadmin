import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/TablePagination";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CihazSatisi {
  id: number;
  no: number;
  firma_id: number;
  firma_adi: string;
  bayi_id: number;
  bayi_adi: string;
  toplam_tutar: number;
  odenen_tutar: number;
  kalan_tutar: number;
  teslim_durumu: 'Beklemede' | 'Hazirlaniyor' | 'Kargoya Verildi' | 'Teslim Edildi';
  aciklama?: string;
  odeme_tarihi: string;
  kalan_odeme_tarihi: string;
  prim_yuzdesi: number;
  prim_tutari: number;
  created_at: string;
  updated_at: string;
}

const formSchema = z.object({
  firma_id: z.string().min(1, "Firma seçiniz"),
  bayi_id: z.string().min(1, "Bayi seçiniz"),
  toplam_tutar: z.string().min(1, "Toplam tutar giriniz"),
  odenen_tutar: z.string().min(1, "Ödenen tutar giriniz"),
  teslim_durumu: z.enum(['Beklemede', 'Hazirlaniyor', 'Kargoya Verildi', 'Teslim Edildi']),
  aciklama: z.string().optional(),
  odeme_tarihi: z.string().optional(),
  kalan_odeme_tarihi: z.string().optional(),
  prim_yuzdesi: z.string().min(0, "Prim yüzdesi 0'dan küçük olamaz"),
});

export default function CihazSatislari() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const limit = 10;
  const [kalanTutar, setKalanTutar] = useState<number>(0);
  const [primTutari, setPrimTutari] = useState<number>(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firma_id: "",
      bayi_id: "",
      toplam_tutar: "",
      odenen_tutar: "0",
      teslim_durumu: "Beklemede",
      aciklama: "",
      prim_yuzdesi: "0",
      odeme_tarihi: "",
      kalan_odeme_tarihi: "",
    },
  });

  useEffect(() => {
    const toplamTutar = parseFloat(form.watch("toplam_tutar") || "0");
    const odenenTutar = parseFloat(form.watch("odenen_tutar") || "0");
    const primYuzdesi = parseFloat(form.watch("prim_yuzdesi") || "0");

    setKalanTutar(toplamTutar - odenenTutar);
    setPrimTutari((toplamTutar * primYuzdesi) / 100);
  }, [form.watch("toplam_tutar"), form.watch("odenen_tutar"), form.watch("prim_yuzdesi")]);


  const { data: firmaResponse } = useQuery<{
    success: boolean;
    data: Array<{ id: number; name: string }>;
  }>({
    queryKey: ["/api/companies"],
  });

  const { data: bayilerResponse } = useQuery<{
    success: boolean;
    data: Array<{ id: number; ad: string }>;
  }>({
    queryKey: ["/api/bayiler", form.watch("firma_id")],
    queryFn: async () => {
      if (!form.watch("firma_id")) {
        return { success: true, data: [] };
      }

      const params = new URLSearchParams({
        firma_id: form.watch("firma_id"),
        limit: "1000",
      });

      const response = await fetch(`/api/bayiler?${params}`);
      if (!response.ok) {
        throw new Error("Bayi listesi alınamadı");
      }
      return response.json();
    },
    enabled: !!form.watch("firma_id"),
  });

  const { data: satislarResponse, isLoading } = useQuery<{
    success: boolean;
    data: Array<CihazSatisi>;
    total: number;
    totalPages: number;
  }>({
    queryKey: ["/api/cihaz-satislari", currentPage, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`/api/cihaz-satislari?${params}`);
      if (!response.ok) {
        throw new Error("Cihaz satışları alınamadı");
      }
      return response.json();
    },
  });

  const createSatisMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const formData = {
        firma_id: parseInt(values.firma_id),
        bayi_id: parseInt(values.bayi_id),
        toplam_tutar: parseFloat(values.toplam_tutar),
        odenen_tutar: parseFloat(values.odenen_tutar),
        teslim_durumu: values.teslim_durumu,
        aciklama: values.aciklama || '',
        odeme_tarihi: values.odeme_tarihi || null,
        kalan_odeme_tarihi: values.kalan_odeme_tarihi || null,
        prim_yuzdesi: parseFloat(values.prim_yuzdesi),
      };

      const response = await fetch("/api/cihaz-satislari", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Bir hata oluştu');
      }

      return result;
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Cihaz satışı başarıyla eklendi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cihaz-satislari"] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Cihaz satışı eklenirken bir hata oluştu",
      });
    },
  });

  const updateSatisMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const formData = {
        firma_id: parseInt(values.firma_id),
        bayi_id: parseInt(values.bayi_id),
        toplam_tutar: parseFloat(values.toplam_tutar),
        odenen_tutar: parseFloat(values.odenen_tutar),
        teslim_durumu: values.teslim_durumu,
        aciklama: values.aciklama || '',
        odeme_tarihi: values.odeme_tarihi || null,
        kalan_odeme_tarihi: values.kalan_odeme_tarihi || null,
        prim_yuzdesi: parseFloat(values.prim_yuzdesi),
      };

      const response = await fetch(`/api/cihaz-satislari/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Bir hata oluştu');
      }

      return result;
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Cihaz satışı başarıyla güncellendi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cihaz-satislari"] });
      setIsDialogOpen(false);
      form.reset();
      setEditingId(null);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Cihaz satışı güncellenirken bir hata oluştu",
      });
    },
  });

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/cihaz-satislari/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Silme işlemi başarısız oldu');
      }

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Başarılı",
          description: "Cihaz satışı başarıyla silindi",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/cihaz-satislari"] });
      } else {
        throw new Error(result.error || 'Silme işlemi başarısız oldu');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error instanceof Error ? error.message : "Silme işlemi sırasında bir hata oluştu",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (satis: CihazSatisi) => {
    setIsDialogOpen(true);
    setEditingId(satis.id);

    const formatDateForInput = (dateString: string | null) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };

    form.reset({
      firma_id: satis.firma_id.toString(),
      bayi_id: satis.bayi_id.toString(),
      toplam_tutar: satis.toplam_tutar.toString(),
      odenen_tutar: satis.odenen_tutar.toString(),
      teslim_durumu: satis.teslim_durumu,
      aciklama: satis.aciklama || "",
      prim_yuzdesi: satis.prim_yuzdesi.toString(),
      odeme_tarihi: formatDateForInput(satis.odeme_tarihi),
      kalan_odeme_tarihi: formatDateForInput(satis.kalan_odeme_tarihi),
    });
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (editingId) {
      updateSatisMutation.mutate(values);
    } else {
      createSatisMutation.mutate(values);
    }
  };

  const defaultValues = {
    firma_id: "",
    bayi_id: "",
    toplam_tutar: "",
    odenen_tutar: "0",
    teslim_durumu: "Beklemede",
    aciklama: "",
    prim_yuzdesi: "0",
    odeme_tarihi: "",
    kalan_odeme_tarihi: "",
  };

  const handleNewSale = () => {
    setEditingId(null);
    form.reset(defaultValues);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const satislar = satislarResponse?.data || [];
  const total = satislarResponse?.total || 0;
  const totalPages = satislarResponse?.totalPages || 1;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Cihaz Satışları</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cihaz satış yönetimi ve takibi
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto" onClick={handleNewSale}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Satış
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Yeni Cihaz Satışı</DialogTitle>
              <DialogDescription>
                Cihaz satış bilgilerini girin
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firma_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Firma</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue("bayi_id", "");
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Firma seçiniz" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {firmaResponse?.data?.map((firma) => (
                              <SelectItem
                                key={firma.id}
                                value={firma.id.toString()}
                              >
                                {firma.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bayi_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bayi</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={!form.watch("firma_id")}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  form.watch("firma_id")
                                    ? "Bayi seçiniz"
                                    : "Önce firma seçiniz"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {bayilerResponse?.data?.map((bayi) => (
                              <SelectItem key={bayi.id} value={bayi.id.toString()}>
                                {bayi.ad}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="toplam_tutar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Toplam Tutar</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Toplam tutar giriniz"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="odenen_tutar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ödenen Tutar</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Ödenen tutar giriniz"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="odeme_tarihi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ödeme Tarihi</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="kalan_odeme_tarihi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kalan Ödeme Tarihi</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Kalan Tutar</Label>
                    <Input
                      type="number"
                      value={kalanTutar}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="prim_yuzdesi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prim Yüzdesi (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Prim yüzdesi giriniz"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <Label>Prim Tutarı</Label>
                    <Input
                      type="number"
                      value={primTutari}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="teslim_durumu"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teslim Durumu</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Teslim durumu seçiniz" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Beklemede">Beklemede</SelectItem>
                          <SelectItem value="Hazirlaniyor">Hazirlaniyor</SelectItem>
                          <SelectItem value="Kargoya Verildi">Kargoya Verildi</SelectItem>
                          <SelectItem value="Teslim Edildi">Teslim Edildi</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="aciklama"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Açıklama</FormLabel>
                        <FormControl>
                          <Input placeholder="Açıklama giriniz" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="submit"
                    className="w-full sm:w-auto"
                    disabled={createSatisMutation.isPending || updateSatisMutation.isPending}
                  >
                    {createSatisMutation.isPending || updateSatisMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      "Kaydet"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cihaz Satışları Listesi</CardTitle>
          <CardDescription>
            Tüm cihaz satışlarını görüntüleyin ve yönetin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell">No</TableHead>
                  <TableHead className="hidden sm:table-cell">Tarih</TableHead>
                  <TableHead>Firma</TableHead>
                  <TableHead>Bayi</TableHead>
                  <TableHead className="hidden sm:table-cell">Toplam Tutar</TableHead>
                  <TableHead className="hidden sm:table-cell">Ödenen Tutar</TableHead>
                  <TableHead className="hidden sm:table-cell">Kalan Tutar</TableHead>
                  <TableHead>Teslim Durumu</TableHead>
                  <TableHead className="hidden sm:table-cell">Prim</TableHead>
                  <TableHead className="hidden sm:table-cell">Ödeme Tarihi</TableHead>
                  <TableHead className="hidden sm:table-cell">Kalan Ödeme Tarihi</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {satislar.length > 0 ? (
                  satislar.map((satis) => (
                    <TableRow key={satis.id}>
                      <TableCell className="hidden sm:table-cell">{satis.no}</TableCell>
                      <TableCell className="hidden sm:table-cell">{formatDate(satis.created_at)}</TableCell>
                      <TableCell>{satis.firma_adi}</TableCell>
                      <TableCell>{satis.bayi_adi}</TableCell>
                      <TableCell className="hidden sm:table-cell">{formatCurrency(satis.toplam_tutar)}</TableCell>
                      <TableCell className="hidden sm:table-cell">{formatCurrency(satis.odenen_tutar)}</TableCell>
                      <TableCell className="hidden sm:table-cell">{formatCurrency(satis.kalan_tutar)}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            satis.teslim_durumu === "Teslim Edildi"
                              ? "bg-green-100 text-green-800"
                              : satis.teslim_durumu === "Kargoya Verildi"
                              ? "bg-blue-100 text-blue-800"
                              : satis.teslim_durumu === "Hazirlaniyor"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {satis.teslim_durumu}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{formatCurrency(satis.prim_tutari)}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {satis.odeme_tarihi ? formatDate(satis.odeme_tarihi) : "-"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {satis.kalan_odeme_tarihi ? formatDate(satis.kalan_odeme_tarihi) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <div className="flex justify-end gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(satis)}
                                  className="h-8 w-8"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Düzenle</p>
                              </TooltipContent>
                            </Tooltip>

                            <AlertDialog open={deletingId === satis.id} onOpenChange={(open) => !open && setDeletingId(null)}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDeletingId(satis.id)}
                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Sil</p>
                                </TooltipContent>
                              </Tooltip>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Satış Kaydını Sil</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Bu satış kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setDeletingId(null)}>İptal</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => handleDelete(satis.id)}
                                  >
                                    Sil
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={12}
                      className="text-center py-4 text-muted-foreground"
                    >
                      Kayıt bulunamadı
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {satislar.length > 0 && (
            <>
              <div className="mt-4">
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={total}
                  itemsPerPage={limit}
                />
              </div>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
                <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-indigo-900">Toplam Tutar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-indigo-700">
                      {formatCurrency(
                        satislar.reduce((sum, satis) => sum + parseFloat(satis.toplam_tutar.toString()), 0)
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-green-900">Ödenen Tutar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-700">
                      {formatCurrency(
                        satislar.reduce((sum, satis) => sum + parseFloat(satis.odenen_tutar.toString()), 0)
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-amber-900">Kalan Tutar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-700">
                      {formatCurrency(
                        satislar.reduce((sum, satis) => sum + parseFloat(satis.kalan_tutar.toString()), 0)
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-pink-900">Toplam Prim</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-pink-700">
                      {formatCurrency(
                        satislar.reduce((sum, satis) => sum + parseFloat(satis.prim_tutari.toString()), 0)
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}