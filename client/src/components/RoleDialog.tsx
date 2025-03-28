import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Check, X } from "lucide-react";

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

// İzin şemasını daha esnek hale getiriyoruz
const permissionSchema = z.object({
  panel: z.object({
    view: z.boolean().optional().default(false),
  }).optional().default({}),
  companies: z.object({
    view: z.boolean().optional().default(false),
    create: z.boolean().optional().default(false),
    edit: z.boolean().optional().default(false),
    delete: z.boolean().optional().default(false),
  }).optional().default({}),
  dealers: z.object({
    view: z.boolean().optional().default(false),
    create: z.boolean().optional().default(false),
    edit: z.boolean().optional().default(false),
    delete: z.boolean().optional().default(false),
  }).optional().default({}),
  users: z.object({
    view: z.boolean().optional().default(false),
    create: z.boolean().optional().default(false),
    edit: z.boolean().optional().default(false),
    delete: z.boolean().optional().default(false),
  }).optional().default({}),
  programUsers: z.object({
    view: z.boolean().optional().default(false),
    create: z.boolean().optional().default(false),
    edit: z.boolean().optional().default(false),
    delete: z.boolean().optional().default(false),
  }).optional().default({}),
  balance: z.object({
    view: z.boolean().optional().default(false),
    load: z.boolean().optional().default(false),
  }).optional().default({}),
  kilometreHacker: z.object({
    view: z.boolean().optional().default(false),
    create: z.boolean().optional().default(false),
    query: z.boolean().optional().default(false),
  }).optional().default({}),
  vinHacker: z.object({
    view: z.boolean().optional().default(false),
    create: z.boolean().optional().default(false),
    query: z.boolean().optional().default(false),
  }).optional().default({}),
  komisyonYonetimi: z.object({
    view: z.boolean().optional().default(false),
    edit: z.boolean().optional().default(false),
  }).optional().default({}),
  ayarlar: z.object({
    view: z.boolean().optional().default(false),
    edit: z.boolean().optional().default(false),
  }).optional().default({}),
  cihazSatislari: z.object({
    view: z.boolean().optional().default(false),
    create: z.boolean().optional().default(false),
    edit: z.boolean().optional().default(false),
  }).optional().default({}),
  cihazSatinAl: z.object({
    view: z.boolean().optional().default(false),
    create: z.boolean().optional().default(false),
  }).optional().default({}),
  reports: z.object({
    view: z.boolean().optional().default(false),
  }).optional().default({}),
  roles: z.object({
    view: z.boolean().optional().default(false),
    create: z.boolean().optional().default(false),
    edit: z.boolean().optional().default(false),
    delete: z.boolean().optional().default(false),
  }).optional().default({}),
});

const roleFormSchema = z.object({
  name: z.string({
    required_error: "Rol adı zorunludur",
  }),
  description: z.string().optional(),
  permissions: permissionSchema,
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

export function RoleDialog({ role, onClose }: RoleDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const defaultPermissions = {
    panel: { view: false },
    companies: { view: false, create: false, edit: false, delete: false },
    dealers: { view: false, create: false, edit: false, delete: false },
    users: { view: false, create: false, edit: false, delete: false },
    programUsers: { view: false, create: false, edit: false, delete: false },
    balance: { view: false, load: false },
    kilometreHacker: { view: false, create: false, query: false },
    vinHacker: { view: false, create: false, query: false },
    komisyonYonetimi: { view: false, edit: false },
    ayarlar: { view: false, edit: false },
    cihazSatislari: { view: false, create: false, edit: false },
    cihazSatinAl: { view: false, create: false },
    reports: { view: false },
    roles: { view: false, create: false, edit: false, delete: false },
  };

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: role?.name || "",
      description: role?.description || "",
      permissions: role ? JSON.parse(role.permissions) : defaultPermissions,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: RoleFormValues) => {
      console.log("Form değerleri:", values);
      const response = await fetch(role ? `/api/roles/${role.id}` : "/api/roles", {
        method: role ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Hatası:", errorText); // Added detailed error logging
        throw new Error(errorText);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({
        title: "Başarılı",
        description: role ? "Rol başarıyla güncellendi" : "Rol başarıyla eklendi",
      });
      setOpen(false);
      form.reset();
      if (onClose) {
        onClose();
      }
    },
    onError: (error) => {
      console.error("Rol kaydetme hatası:", error); // Added detailed error logging
      toast({
        title: "Hata",
        description: `${role ? "Rol güncellenirken" : "Rol eklenirken"} bir hata oluştu: ${error}`,
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
    Object.entries(defaultPermissions).forEach(([module, permissions]) => {
      Object.keys(permissions).forEach((action) => {
        form.setValue(`permissions.${module}.${action}`, select, {
          shouldValidate: true,
        });
      });
    });
  }

  function handleModulePermissions(module: string, permissions: object, select: boolean) {
    Object.keys(permissions).forEach((action) => {
      form.setValue(`permissions.${module}.${action}`, select, {
        shouldValidate: true,
      });
    });
  }

  const dialogContent = (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{role ? "Rol Düzenle" : "Yeni Rol Ekle"}</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rol Adı</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Açıklama</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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

            {Object.entries(defaultPermissions).map(([module, permissions]) => (
              <div key={module} className="space-y-2 border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium capitalize">
                    {module === "users" ? "Panel Kullanıcıları" :
                      module === "dealers" ? "Bayiler" :
                        module === "companies" ? "Firmalar" :
                          module === "programUsers" ? "Program Kullanıcıları" :
                            module === "balance" ? "Bakiye Yönetimi" :
                              module === "kilometreHacker" ? "Kilometre Hacker" :
                                module === "vinHacker" ? "VIN Hacker" :
                                  module === "komisyonYonetimi" ? "Komisyon Yönetimi" :
                                    module === "ayarlar" ? "Ayarlar" :
                                      module === "cihazSatislari" ? "Cihaz Satışları" :
                                        module === "cihazSatinAl" ? "Cihaz Satın Al" :
                                          module === "reports" ? "Raporlar" :
                                            module === "roles" ? "Roller" : "Panel"}
                  </h4>
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
                  {Object.entries(permissions).map(([action, _]) => (
                    <div key={action} className="flex items-center space-x-2">
                      <FormField
                        control={form.control}
                        name={`permissions.${module}.${action}`}
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
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
                    </div>
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
              {mutation.isPending ? (role ? "Güncelleniyor..." : "Ekleniyor...") : (role ? "Güncelle" : "Ekle")}
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Rol Ekle
        </Button>
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  );
}