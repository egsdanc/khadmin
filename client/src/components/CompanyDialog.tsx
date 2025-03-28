import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const companySchema = z.object({
  name: z.string().min(1, "Firma adı zorunludur"),
  firma_unvan: z.string().min(1, "Firma ünvanı zorunludur"),
  email: z.string().email("Geçerli bir email adresi giriniz"),
  telefon: z.string().min(1, "Telefon numarası zorunludur"),
  adres: z.string().min(1, "Adres zorunludur"),
  vergi_dairesi: z.string().min(1, "Vergi dairesi zorunludur"),
  vergi_no: z.string().optional(),
  tc_no: z.string().optional(),
  iban: z.string().min(1, "IBAN zorunludur"),
});

type CompanyFormValues = z.infer<typeof companySchema>;

interface CompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompanyDialog({ open, onOpenChange }: CompanyDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      firma_unvan: "",
      email: "",
      telefon: "",
      adres: "",
      vergi_dairesi: "",
      vergi_no: "",
      tc_no: "",
      iban: "",
    },
  });

  const createCompany = useMutation({
    mutationFn: async (data: CompanyFormValues) => {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({
        title: "Başarılı",
        description: "Firma başarıyla eklendi",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  async function onSubmit(data: CompanyFormValues) {
    createCompany.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Yeni Firma Ekle</DialogTitle>
          <DialogDescription>
            Firma bilgilerini girerek yeni bir firma ekleyebilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Firma Adı</FormLabel>
                    <FormControl>
                      <Input placeholder="Firma adı giriniz" {...field} />
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
                    <FormLabel>Firma Ünvanı</FormLabel>
                    <FormControl>
                      <Input placeholder="Firma ünvanı giriniz" {...field} />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email adresi giriniz" {...field} />
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
                      <Input placeholder="Telefon numarası giriniz" {...field} />
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
                      <Input placeholder="Vergi dairesi giriniz" {...field} />
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
                      <Input placeholder="Vergi numarası giriniz" {...field} />
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
                    <FormLabel>TC No</FormLabel>
                    <FormControl>
                      <Input placeholder="TC kimlik numarası giriniz" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="adres"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Adres</FormLabel>
                    <FormControl>
                      <Input placeholder="Adres giriniz" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="iban"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>IBAN</FormLabel>
                    <FormControl>
                      <Input placeholder="IBAN numarası giriniz" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                İptal
              </Button>
              <Button type="submit" disabled={createCompany.isPending}>
                {createCompany.isPending ? "Ekleniyor..." : "Ekle"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}