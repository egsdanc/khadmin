import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface User {
  id?: number;
  isim: string;
  sifre?: string;
  macAdress: string;
  firstlogin: boolean;
  firma?: string;
  bayi?: string;
}

interface UserEditDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserEditDialog({ user, open, onOpenChange }: UserEditDialogProps) {
  const [formData, setFormData] = useState<Partial<User>>({
    isim: '',
    sifre: '',
    macAdress: user ? user.macAdress : 'ASDFGHJK',
    firstlogin: false,
    firma: '',
    bayi: ''
  });

  useEffect(() => {
    if (open && user) {
      // Form verilerini yükle, şifreyi sıfırla
      const { sifre, ...userData } = user;
      console.log('Loading user data:', { ...userData, sifre: undefined });
      setFormData({
        ...userData,
        sifre: '' // Şifre alanı her zaman boş başlar
      });
    } else {
      // Yeni kullanıcı için boş form
      setFormData({
        isim: '',
        sifre: '',
        macAdress: 'ASDFGHJK',
        firstlogin: false,
        firma: '',
        bayi: ''
      });
    }
  }, [user, open]);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createUserMutation = useMutation({
    mutationFn: async (userData: Partial<User>) => {
      try {
        // API için veriyi hazırla
        const dataToSend: Partial<User> = { ...userData };

        // Şifre alanını kontrol et
        if (dataToSend.sifre === '') {
          delete dataToSend.sifre;
        }

        const endpoint = user?.id ? `/api/kullanicilar/${user.id}` : '/api/kullanicilar';
        const method = user?.id ? 'PUT' : 'POST';

        console.log('Sending API request:', {
          endpoint,
          method,
          data: { ...dataToSend, sifre: dataToSend.sifre ? '[HIDDEN]' : undefined }
        });

        const response = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(dataToSend),
          credentials: 'include'
        });

        console.log('API response status:', response.status);
        const contentType = response.headers.get('content-type');
        console.log('API response content-type:', contentType);

        const responseText = await response.text();
        console.log('API raw response:', responseText);

        if (!response.ok) {
          throw new Error(responseText || `${method} request failed`);
        }

        // Check if response is JSON
        if (!contentType?.includes('application/json')) {
          console.error('Invalid response type:', contentType);
          throw new Error('Server returned invalid response type');
        }

        try {
          const data = JSON.parse(responseText);
          return data;
        } catch (e) {
          console.error('JSON parse error:', e);
          throw new Error('Invalid JSON response from server');
        }
      } catch (error) {
        console.error('API request error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/kullanicilar'] });
      toast({
        title: "Başarılı",
        description: user?.id ? "Kullanıcı başarıyla güncellendi" : "Kullanıcı başarıyla eklendi",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      console.error('Form submission error:', error);
      toast({
        title: "Hata",
        description: `İşlem başarısız oldu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Zorunlu alan kontrolü
      if (!formData.isim?.trim() || !formData.macAdress?.trim()) {
        toast({
          title: "Hata",
          description: "Ad Soyad ve MAC Adresi alanları zorunludur",
          variant: "destructive",
        });
        return;
      }

      // Yeni kullanıcı için şifre kontrolü
      if (!user?.id && !formData.sifre?.trim()) {
        toast({
          title: "Hata",
          description: "Yeni kullanıcı için şifre gereklidir",
          variant: "destructive",
        });
        return;
      }

      console.log('Submitting form:', {
        ...formData,
        sifre: formData.sifre ? '[HIDDEN]' : undefined
      });

      await createUserMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Program Kullanıcı {user?.id ? 'Düzenle' : 'Ekle'}</DialogTitle>
            <DialogDescription>
              Program kullanıcısı için gerekli bilgileri eksiksiz doldurun.
            </DialogDescription>
          </DialogHeader>

          <Alert className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Program kullanıcısı eklerken First Login Pasif olmalıdır. MAC adresini "ASDFGHJK" olarak giriniz. 
              Bayi programda ilk giriş yaptığında MAC adresi otomatik olarak güncellenecek ve First Login de Aktif durumuna gelecektir.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="isim">Ad Soyad</Label>
                <Input
                  id="isim"
                  value={formData.isim || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, isim: e.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="macAdress">MAC Adresi</Label>
                <Input
                  id="macAdress"
                  value={formData.macAdress || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, macAdress: e.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sifre">
                  Şifre {user?.id && "(Boş bırakılırsa değişmez)"}
                </Label>
                <Input
                  id="sifre"
                  type="password"
                  value={formData.sifre || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, sifre: e.target.value }))}
                  {...(!user?.id && { required: true })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="firstlogin">First Login</Label>
                <Switch
                  id="firstlogin"
                  checked={formData.firstlogin}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, firstlogin: checked }))}
                  disabled={!user?.id} // Yeni kullanıcı eklerken pasif olmalı
                />
                <span className="text-sm text-muted-foreground">
                  {formData.firstlogin ? 'Aktif' : 'Pasif'}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="firma">Firma</Label>
                <Select 
                  value={formData.firma || ''} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, firma: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Firma Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Garantili Arabam">Garantili Arabam</SelectItem>
                    <SelectItem value="General Oto Ekspertiz">General Oto Ekspertiz</SelectItem>
                    <SelectItem value="Dynobil">Dynobil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bayi">Bayi</Label>
                <Select 
                  value={formData.bayi || ''} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, bayi: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Bayi Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ankara / Yenimahalle">Ankara / Yenimahalle</SelectItem>
                    <SelectItem value="İstanbul / Kadıköy">İstanbul / Kadıköy</SelectItem>
                    <SelectItem value="İzmir / Karşıyaka">İzmir / Karşıyaka</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit">Kaydet</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}