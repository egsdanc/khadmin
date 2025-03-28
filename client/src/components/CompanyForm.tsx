import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const companySchema = z.object({
  name: z.string().min(1, "Firma adı zorunludur"),
  firma_unvan: z.string().min(1, "Şirket ünvanı zorunludur"),
  email: z.string().email("Geçerli bir email adresi giriniz"),
  phone: z.string().min(1, "Telefon numarası zorunludur"),
  address: z.string().min(1, "Adres zorunludur"),
  vergi_dairesi: z.string().min(1, "Vergi dairesi zorunludur"),
  vergi_no: z.string().optional(),
  tc_no: z.string().optional(),
  iban: z.string().min(1, "IBAN zorunludur"),
  alt_uye_id: z.string().min(1, "Alt üye dış kimliği zorunludur"),
  alt_uye_tip: z.string().min(1, "Alt üye tipi zorunludur"),
  alt_uye_key: z.string().min(1, "Alt üye anahtarı zorunludur"),
});

type CompanyFormValues = z.infer<typeof companySchema>;

interface CompanyFormProps {
  onClose: () => void;
}

export function CompanyForm({ onClose }: CompanyFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      firma_unvan: "",
      email: "",
      phone: "",
      address: "",
      vergi_dairesi: "",
      vergi_no: "",
      tc_no: "",
      iban: "",
      alt_uye_id: "",
      alt_uye_tip: "",
      alt_uye_key: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CompanyFormValues) => {
      const response = await fetch("/api/firmalar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Firma eklenirken bir hata oluştu");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: "Başarılı", description: "Firma başarıyla eklendi" });
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

  function onSubmit(data: CompanyFormValues) {
    mutation.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Temel Bilgiler */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Firma Adı</FormLabel>
                <FormControl>
                  <Input placeholder="Firma adını giriniz" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="firma_unvan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Şirket Ünvanı</FormLabel>
                <FormControl>
                  <Input placeholder="Şirket ünvanını giriniz" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-posta</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="E-posta adresini giriniz" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefon</FormLabel>
                <FormControl>
                  <Input placeholder="Telefon numarasını giriniz" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Vergi ve Adres Bilgileri */}
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adres</FormLabel>
                <FormControl>
                  <Input placeholder="Adresi giriniz" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vergi_dairesi"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vergi Dairesi</FormLabel>
                <FormControl>
                  <Input placeholder="Vergi dairesini giriniz" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vergi_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vergi Numarası</FormLabel>
                <FormControl>
                  <Input placeholder="Vergi numarasını giriniz" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tc_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>TC Kimlik No</FormLabel>
                <FormControl>
                  <Input placeholder="TC Kimlik numarasını giriniz" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Finansal Bilgiler */}
          <FormField
            control={form.control}
            name="iban"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IBAN</FormLabel>
                <FormControl>
                  <Input placeholder="IBAN numarasını giriniz" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="alt_uye_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alt Üye Dış Kimliği</FormLabel>
                <FormControl>
                  <Input placeholder="Alt üye dış kimliğini giriniz" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="alt_uye_tip"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alt Üye Tipi</FormLabel>
                <FormControl>
                  <Input placeholder="Alt üye tipini giriniz" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="alt_uye_key"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alt Üye Anahtarı</FormLabel>
                <FormControl>
                  <Input placeholder="Alt üye anahtarını giriniz" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            İptal
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="w-full sm:w-auto"
          >
            {mutation.isPending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </form>
    </Form>
  );
}