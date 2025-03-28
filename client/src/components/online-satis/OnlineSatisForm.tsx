import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const onlineSatisSchema = z.object({
  musteri_adi: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
  musteri_soyadi: z.string().min(2, "Soyad en az 2 karakter olmalıdır"),
  tc_no: z.string().optional(),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  telefon: z.string().min(10, "Geçerli bir telefon numarası giriniz"),
  adres: z.string().min(10, "Adres en az 10 karakter olmalıdır"),
  il: z.string().min(2, "İl seçiniz"),
  ilce: z.string().min(2, "İlçe seçiniz"),
  fatura_tipi: z.enum(["Bireysel", "Kurumsal"]),
  vergi_dairesi: z.string().optional(),
  vergi_no: z.string().optional(),
});

export function OnlineSatisForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof onlineSatisSchema>>({
    resolver: zodResolver(onlineSatisSchema),
    defaultValues: {
      fatura_tipi: "Bireysel",
      musteri_adi: "",
      musteri_soyadi: "",
      tc_no: "",
      email: "",
      telefon: "",
      adres: "",
      il: "",
      ilce: "",
      vergi_dairesi: "",
      vergi_no: "",
    },
  });

async function onSubmit(values: z.infer<typeof onlineSatisSchema>) {
  console.log("Formvaluess:", values);
  try {
    setLoading(true);
    console.log("Form values:", values);

    const response = await fetch("/api/payment/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 60000.00, // Güncellenen tutar
        customerInfo: {
          firstName: values.musteri_adi.trim(),
          lastName: values.musteri_soyadi.trim(),
          email: values.email.trim(),
          phone: values.telefon.trim(),
          address: values.adres.trim(),
          city: values.il.trim(),
          country: 'Turkey'
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Ödeme işlemi başlatılamadı');
    }

    const result = await response.json();
    console.log("Payment response:", result);

    if (result.checkoutFormContent) {
      // Create a temporary div to hold the form
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = result.checkoutFormContent;
      document.body.appendChild(tempDiv);

      // Find and submit the form
      const form = tempDiv.querySelector('form');
      if (form) {
        form.submit();
      } else {
        throw new Error("Ödeme formu oluşturulamadı");
      }
    } else {
      toast({
        title: "Hata",
        description: "Ödeme sayfası oluşturulamadı",
        variant: "destructive",
      });
    }

  } catch (error: any) {
    console.error('Payment error:', error);
    toast({
      title: "Hata",
      description: error.message || "Bir hata oluştu",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="fatura_tipi"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fatura Tipi</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-row space-x-4"
                  >
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <RadioGroupItem value="Bireysel" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Bireysel
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <RadioGroupItem value="Kurumsal" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Kurumsal
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="musteri_adi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ad</FormLabel>
                  <FormControl>
                    <Input placeholder="Adınız" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="musteri_soyadi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Soyad</FormLabel>
                  <FormControl>
                    <Input placeholder="Soyadınız" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="tc_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>TC Kimlik No (Opsiyonel)</FormLabel>
                <FormControl>
                  <Input placeholder="TC Kimlik No" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-posta</FormLabel>
                  <FormControl>
                    <Input placeholder="E-posta adresiniz" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefon</FormLabel>
                  <FormControl>
                    <Input placeholder="Telefon numaranız" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="adres"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adres</FormLabel>
                <FormControl>
                  <Input placeholder="Açık adresiniz" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="il"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>İl</FormLabel>
                  <FormControl>
                    <Input placeholder="İl" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ilce"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>İlçe</FormLabel>
                  <FormControl>
                    <Input placeholder="İlçe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {form.watch("fatura_tipi") === "Kurumsal" && (
            <>
              <FormField
                control={form.control}
                name="vergi_dairesi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vergi Dairesi</FormLabel>
                    <FormControl>
                      <Input placeholder="Vergi Dairesi" {...field} />
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
                    <FormLabel>Vergi No</FormLabel>
                    <FormControl>
                      <Input placeholder="Vergi No" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ödeme Başlatılıyor...
              </>
            ) : (
              "Ödemeye Geç"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}