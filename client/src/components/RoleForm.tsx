import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const permissionSchema = z.object({
  panel: z.object({
    view: z.boolean(),
  }),
  companies: z.object({
    view: z.boolean(),
    create: z.boolean(),
    edit: z.boolean(),
    delete: z.boolean(),
  }),
  dealers: z.object({
    view: z.boolean(),
    create: z.boolean(),
    edit: z.boolean(),
    delete: z.boolean(),
  }),
  users: z.object({
    view: z.boolean(),
    create: z.boolean(),
    edit: z.boolean(),
    delete: z.boolean(),
  }),
  programUsers: z.object({
    view: z.boolean(),
    create: z.boolean(),
    edit: z.boolean(),
    delete: z.boolean(),
  }),
  balance: z.object({
    view: z.boolean(),
    load: z.boolean(),
  }),
  tests: z.object({
    view: z.boolean(),
    create: z.boolean(),
    vinView: z.boolean(),
    vinQuery: z.boolean(),
  }),
  reports: z.object({
    view: z.boolean(),
  }),
  roles: z.object({
    view: z.boolean(),
    create: z.boolean(),
    edit: z.boolean(),
    delete: z.boolean(),
  }),
});

const roleFormSchema = z.object({
  name: z.string().min(1, "Rol adı zorunludur"),
  description: z.string().optional(),
  permissions: permissionSchema,
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

interface RoleFormProps {
  onClose: () => void;
}

export function RoleForm({ onClose }: RoleFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const defaultPermissions = {
    panel: { view: false },
    companies: { view: false, create: false, edit: false, delete: false },
    dealers: { view: false, create: false, edit: false, delete: false },
    users: { view: false, create: false, edit: false, delete: false },
    programUsers: { view: false, create: false, edit: false, delete: false },
    balance: { view: false, load: false },
    tests: { view: false, create: false, vinView: false, vinQuery: false },
    reports: { view: false },
    roles: { view: false, create: false, edit: false, delete: false },
  };

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: defaultPermissions,
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: async (data: RoleFormValues) => {
      const response = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Rol oluşturulurken bir hata oluştu");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({
        title: "Başarılı",
        description: "Rol başarıyla oluşturuldu",
      });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: RoleFormValues) {
    createRoleMutation.mutate(data);
  }

  function handlePermissionChange(
    module: string,
    action: string,
    checked: boolean
  ) {
    form.setValue(`permissions.${module}.${action}`, checked, {
      shouldValidate: true,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
          <h3 className="text-lg font-medium">İzinler</h3>

          {Object.entries(defaultPermissions).map(([module, permissions]) => (
            <div key={module} className="space-y-2">
              <h4 className="font-medium capitalize">
                {module === "users" ? "Kullanıcılar" :
                 module === "dealers" ? "Bayiler" :
                 module === "companies" ? "Firmalar" :
                 module === "programUsers" ? "Program Kullanıcıları" :
                 module === "balance" ? "Bakiye İşlemleri" :
                 module === "tests" ? "Test İşlemleri" :
                 module === "reports" ? "Raporlar" :
                 module === "roles" ? "Roller" : "Panel"}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(permissions).map(([action, _]) => (
                  <div key={action} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${module}-${action}`}
                      checked={form.watch(`permissions.${module}.${action}`)}
                      onCheckedChange={(checked) => {
                        handlePermissionChange(module, action, checked === true);
                      }}
                    />
                    <label
                      htmlFor={`${module}-${action}`}
                      className="text-sm font-medium capitalize"
                    >
                      {action === "view" ? "Görüntüle" :
                       action === "create" ? "Oluştur" :
                       action === "edit" ? "Düzenle" :
                       action === "delete" ? "Sil" :
                       action === "load" ? "Yükle" :
                       action === "vinView" ? "VIN Görüntüle" :
                       action === "vinQuery" ? "VIN Sorgula" : action}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" disabled={createRoleMutation.isPending}>
            {createRoleMutation.isPending ? "Oluşturuluyor..." : "Oluştur"}
          </Button>
        </div>
      </form>
    </Form>
  );
}