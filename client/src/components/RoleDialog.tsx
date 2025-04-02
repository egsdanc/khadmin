import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Check, X } from "lucide-react";
import { api } from "@/lib/api";

interface Role {
  id: number;
  name: string;
  description: string | null;
  permissions: string;
}

interface RoleDialogProps {
  role?: Role;
  onClose?: () => void;
}

// İzin şeması
const permissionSchema = z.object({
  "Panel": z.object({
    view: z.boolean(),
  }),
  "Firmalar": z.object({
    view: z.boolean(),
    create: z.boolean(),
    edit: z.boolean(),
    delete: z.boolean(),
  }),
  "Bayiler": z.object({
    view: z.boolean(),
    create: z.boolean(),
    edit: z.boolean(),
    delete: z.boolean(),
  }),
  "Bakiye-Yonetimi": z.object({
    view: z.boolean(),
    load: z.boolean(),
  }),
  "Komisyon-Yonetimi": z.object({
    view: z.boolean(),
    edit: z.boolean(),
  }),
  "Panel-Kullanicilari": z.object({
    view: z.boolean(),
    create: z.boolean(),
    edit: z.boolean(),
    delete: z.boolean(),
  }),
  "Program-Kullanicilari": z.object({
    view: z.boolean(),
    create: z.boolean(),
    edit: z.boolean(),
    delete: z.boolean(),
  }),
  "Kilometre-Hacker": z.object({
    view: z.boolean(),
    create: z.boolean(),
    query: z.boolean(),
  }),
  "VIN-Hacker": z.object({
    view: z.boolean(),
    create: z.boolean(),
    query: z.boolean(),
  }),
  "Cihaz-Satislari": z.object({
    view: z.boolean(),
    create: z.boolean(),
    edit: z.boolean(),
  }),
  "Cihaz-Satin-Al": z.object({
    view: z.boolean(),
    create: z.boolean(),
  }),
  "Roller": z.object({
    view: z.boolean(),
    create: z.boolean(),
    edit: z.boolean(),
    delete: z.boolean(),
  }),
  "Raporlar": z.object({
    view: z.boolean(),
  }),
  "Ayarlar": z.object({
    view: z.boolean(),
    edit: z.boolean(),
  }),
});

const roleFormSchema = z.object({
  permissions: permissionSchema,
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

export function RoleDialog({ role, onClose }: RoleDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      permissions: {
        "Panel": { view: false },
        "Firmalar": {
          view: false,
          create: false,
          edit: false,
          delete: false,
        },
        "Bayiler": {
          view: false,
          create: false,
          edit: false,
          delete: false,
        },
        "Bakiye-Yonetimi": {
          view: false,
          load: false,
        },
        "Komisyon-Yonetimi": {
          view: false,
          edit: false,
        },
        "Panel-Kullanicilari": {
          view: false,
          create: false,
          edit: false,
          delete: false,
        },
        "Program-Kullanicilari": {
          view: false,
          create: false,
          edit: false,
          delete: false,
        },
        "Kilometre-Hacker": {
          view: false,
          create: false,
          query: false,
        },
        "VIN-Hacker": {
          view: false,
          create: false,
          query: false,
        },
        "Cihaz-Satislari": {
          view: false,
          create: false,
          edit: false,
        },
        "Cihaz-Satin-Al": {
          view: false,
          create: false,
        },
        "Roller": {
          view: false,
          create: false,
          edit: false,
          delete: false,
        },
        "Raporlar": { view: false },
        "Ayarlar": {
          view: false,
          edit: false,
        },
      },
    },
  });

  // Rol izinlerini getir
  useEffect(() => {
    const fetchPermissions = async () => {
      if (role?.name) {
        console.log("Rol adı:", role.name);
        try {
          const response = await api.get(`/roles/list-permissions?role=${role.name}`);
          if (response.data.success) {
            console.log("Yüklenen izinler:", response.data.data);
            const permissions = response.data.data;
            
            // Form state'ini sıfırla
            form.reset({
              permissions: {
                "Panel": { view: Boolean(permissions["Panel"]?.view) },
                "Firmalar": {
                  view: Boolean(permissions["Firmalar"]?.view),
                  create: Boolean(permissions["Firmalar"]?.create),
                  edit: Boolean(permissions["Firmalar"]?.edit),
                  delete: Boolean(permissions["Firmalar"]?.delete),
                },
                "Bayiler": {
                  view: Boolean(permissions["Bayiler"]?.view),
                  create: Boolean(permissions["Bayiler"]?.create),
                  edit: Boolean(permissions["Bayiler"]?.edit),
                  delete: Boolean(permissions["Bayiler"]?.delete),
                },
                "Bakiye-Yonetimi": {
                  view: Boolean(permissions["Bakiye-Yonetimi"]?.view),
                  load: Boolean(permissions["Bakiye-Yonetimi"]?.load),
                },
                "Komisyon-Yonetimi": {
                  view: Boolean(permissions["Komisyon-Yonetimi"]?.view),
                  edit: Boolean(permissions["Komisyon-Yonetimi"]?.edit),
                },
                "Panel-Kullanicilari": {
                  view: Boolean(permissions["Panel-Kullanicilari"]?.view),
                  create: Boolean(permissions["Panel-Kullanicilari"]?.create),
                  edit: Boolean(permissions["Panel-Kullanicilari"]?.edit),
                  delete: Boolean(permissions["Panel-Kullanicilari"]?.delete),
                },
                "Program-Kullanicilari": {
                  view: Boolean(permissions["Program-Kullanicilari"]?.view),
                  create: Boolean(permissions["Program-Kullanicilari"]?.create),
                  edit: Boolean(permissions["Program-Kullanicilari"]?.edit),
                  delete: Boolean(permissions["Program-Kullanicilari"]?.delete),
                },
                "Kilometre-Hacker": {
                  view: Boolean(permissions["Kilometre-Hacker"]?.view),
                  create: Boolean(permissions["Kilometre-Hacker"]?.create),
                  query: Boolean(permissions["Kilometre-Hacker"]?.query),
                },
                "VIN-Hacker": {
                  view: Boolean(permissions["VIN-Hacker"]?.view),
                  create: Boolean(permissions["VIN-Hacker"]?.create),
                  query: Boolean(permissions["VIN-Hacker"]?.query),
                },
                "Cihaz-Satislari": {
                  view: Boolean(permissions["Cihaz-Satislari"]?.view),
                  create: Boolean(permissions["Cihaz-Satislari"]?.create),
                  edit: Boolean(permissions["Cihaz-Satislari"]?.edit),
                },
                "Cihaz-Satin-Al": {
                  view: Boolean(permissions["Cihaz-Satin-Al"]?.view),
                  create: Boolean(permissions["Cihaz-Satin-Al"]?.create),
                },
                "Roller": {
                  view: Boolean(permissions["Roller"]?.view),
                  create: Boolean(permissions["Roller"]?.create),
                  edit: Boolean(permissions["Roller"]?.edit),
                  delete: Boolean(permissions["Roller"]?.delete),
                },
                "Raporlar": { view: Boolean(permissions["Raporlar"]?.view) },
                "Ayarlar": {
                  view: Boolean(permissions["Ayarlar"]?.view),
                  edit: Boolean(permissions["Ayarlar"]?.edit),
                },
              },
            });
          } else {
            toast({
              title: "Hata",
              description: response.data.message || "İzinler getirilemedi",
              variant: "destructive",
            });
          }
        } catch (error: any) {
          console.error("Error fetching permissions:", error);
          toast({
            title: "Hata",
            description: error.response?.data?.message || "İzinler getirilirken bir hata oluştu",
            variant: "destructive",
          });
        }
      }
    };

    fetchPermissions();
  }, [role?.name, form, toast]);

  useEffect(() => {
    console.log("Form değerleri güncellendi:", form.getValues());
  }, [form.watch()]);
  
  const mutation = useMutation({
    mutationFn: async (values: RoleFormValues) => {
      console.log("Role name being sent:", role?.name); // Add this log
      
      if (!role?.name) {
        throw new Error("Rol adı zorunludur");
      }
      
      const response = await api.post("/roles/update-permissions", {
        role: role.name, // Use role.name directly, not role?.name
        permissions: values.permissions,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({
        title: "Başarılı",
        description: "Rol izinleri başarıyla güncellendi",
      });
      setOpen(false);
      form.reset();
      if (onClose) {
        onClose();
      }
    },
    onError: (error: any) => {
      console.error("İzin güncelleme hatası:", error);
      toast({
        title: "Hata",
        description: error.response?.data?.message || "Rol izinleri güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: RoleFormValues) {
    console.log("Form gönderiliyor:", data);
    mutation.mutate(data);
  }

  function handleClose() {
    setOpen(false);
    form.reset();
    if (onClose) {
      onClose();
    }
  }

  function handleSelectAllPermissions(select: boolean) {
    const permissions = form.getValues("permissions");
    Object.keys(permissions).forEach((module) => {
      const modulePermissions = permissions[module as keyof typeof permissions];
      if (modulePermissions) {
        Object.keys(modulePermissions).forEach((action) => {
          form.setValue(`permissions.${module}.${action}` as any, select, {
            shouldValidate: true,
          });
        });
      }
    });
  }

  function handleModulePermissions(module: string, permissions: object, select: boolean) {
    Object.keys(permissions).forEach((action) => {
      form.setValue(`permissions.${module}.${action}` as any, select, {
        shouldValidate: true,
      });
    });
  }

  const dialogContent = (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{role?.name} Rol İzinlerini Düzenle</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">İzinler</h3>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={() => handleSelectAllPermissions(true)}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Tümünü Seç
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleSelectAllPermissions(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Tümünü Kaldır
                </Button>
              </div>
            </div>

            {Object.entries(form.watch("permissions") || {}).map(([module, permissions]) => (
              <div key={module} className="space-y-2 border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">{module}</h4>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => handleModulePermissions(module, permissions, true)}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Tümünü Seç
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleModulePermissions(module, permissions, false)}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Tümünü Kaldır
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(permissions).map(([action, value]) => (
                    <FormField
                      key={`${module}-${action}`}
                      control={form.control}
                      name={`permissions.${module}.${action}` as any}
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value as boolean}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <label
                            htmlFor={`${module}-${action}`}
                            className="text-sm font-medium capitalize"
                          >
                            {action === "view" ? "Görüntüle" :
                              action === "create" ? "Oluştur" :
                                action === "edit" ? "Düzenle" :
                                  action === "delete" ? "Sil" :
                                    action === "load" ? "Yükle" :
                                      action === "query" ? "Sorgula" : action}
                          </label>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              İptal
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );

  if (role) {
    return (
      <Dialog open={true} onOpenChange={handleClose}>
        {dialogContent}
      </Dialog>
    );
  }

  return null;
}