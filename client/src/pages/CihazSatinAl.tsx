import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { OnlineSatisForm } from "@/components/online-satis/OnlineSatisForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

export default function CihazSatinAl() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-red-50 via-rose-50 to-red-100 rounded-2xl p-8 mb-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-rose-600">
                Kilometre Hacker Cihazı
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Araçlarınızın kilometre verilerini güvenle tespit edin! İkinci el araç alım-satım süreçlerinde kilometre tespitini hızlı, güvenilir ve doğru bir şekilde yapmanızı sağlayan yenilikçi bir teknolojik çözüm.
              </p>
              <div className="bg-white/80 backdrop-blur rounded-lg p-6 mb-6">
                <div className="text-3xl font-bold text-red-600 mb-2">60.000 ₺</div>
                <p className="text-sm text-gray-500">KDV Dahil</p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className="w-full md:w-auto bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                  >
                    Hemen Satın Al
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Sipariş Bilgileri</DialogTitle>
                  </DialogHeader>
                  <OnlineSatisForm />
                </DialogContent>
              </Dialog>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-red-100 to-rose-100 p-6 flex items-center justify-center">
                <img
                  src="/kilometre-hacker-cihazi.jpg"
                  alt="Kilometre Hacker Cihazı"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Ürün Açıklaması */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Neden Kilometre Hacker Cihazı?</h2>
          <div className="prose max-w-none text-gray-600">
            <p className="mb-4">
              Kilometre Hacker Cihazı, ikinci el araç alım-satım süreçlerinde kilometre tespitini hızlı, güvenilir ve doğru bir şekilde yapmanızı sağlayan yenilikçi bir teknolojik çözümdür. Hem bireysel kullanıcılar hem de profesyonel oto ekspertiz işletmeleri için tasarlanmıştır.
            </p>
            <p className="mb-4">
              Saniyeler içinde araç kilometre verilerini okur ve analiz eder. Motor, ABS, şanzıman, direksiyon ve diğer elektronik sistemlerden kilometre bilgilerini doğrudan okuma özelliğine sahiptir.
            </p>
            <p>
              Basit arayüzü sayesinde herkes tarafından kolayca kullanılabilir. Geniş araç yelpazesiyle uyumlu çalışır ve kapsamlı destek sunar.
            </p>
          </div>
        </div>

        {/* Kimler İçin Uygun */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Kimler İçin Uygun?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <PackageItem
              title="Bireysel Kullanıcılar"
              description="İkinci el araç satın almadan önce aracın kilometre geçmişini tespit etmek isteyenler."
            />
            <PackageItem
              title="Oto Ekspertiz Firmaları"
              description="Araç kilometre tespiti hizmetlerini güvenilir bir şekilde sunmayı hedefleyen profesyoneller."
            />
            <PackageItem
              title="Galeriler ve Araç Alım-Satım Firmaları"
              description="İş süreçlerini kolaylaştırmak ve müşterilere güvenilir hizmet sağlamak isteyen işletmeler."
            />
          </div>
        </div>

        {/* Özellikler */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Cihaz Özellikleri</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <FeatureItem text="Hatasız veri tespiti ve manipülasyon kontrolü" />
              <FeatureItem text="Geniş araç yelpazesiyle uyumlu çalışır ve kapsamlı destek sunar" />
              <FeatureItem text="Saniyeler içinde sonuç alma" />
              <FeatureItem text="Motor, ABS, şanzıman, direksiyon ve diğer elektronik sistemlerden kilometre bilgilerini doğrudan okuma özelliği" />
              <FeatureItem text="Profesyonel teknik destek" />
              <FeatureItem text="Kullanıcı dostu arayüz" />
            </div>
            <div className="space-y-4">
              <FeatureItem text="Gelişmiş güvenlik sistemi" />
              <FeatureItem text="1 yıl garanti" />
              <FeatureItem text="Hızlı işlem süresi" />
              <FeatureItem text="Güvenli veri analizi" />
              <FeatureItem text="7/24 teknik destek" />
              <FeatureItem text="Ücretsiz kargo" />
            </div>
          </div>
        </div>

        {/* Kutu İçeriği */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Kutu İçeriği</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <PackageItem
              title="Kilometre Hacker OBD Cihazı"
              description="Ana cihaz"
            />
            <PackageItem
              title="WiFi Dongle"
              description="Kablosuz bağlantı aparatı"
            />
            <PackageItem
              title="Kullanım Kılavuzu"
              description="Detaylı kullanım talimatları"
            />
            <PackageItem
              title="Lisans ve Teknik Destek"
              description="1 yıl garantili lisans ve destek"
            />
          </div>
        </div>

        {/* Garanti ve Destek */}
        <Card className="p-6 bg-gradient-to-br from-red-50 to-rose-50">
          <h2 className="text-2xl font-bold mb-4">Garanti ve Teknik Destek</h2>
          <p className="text-gray-600 mb-4">
            Cihazınız 1 yıl boyunca garantilidir. Teknik ekibimiz 7/24 yanınızda olup, WhatsApp üzerinden anlık destek sağlamaktadır.
            Her yapılan sorgulama için %10 + KDV ücretlendirilirsiniz.
          </p>
          <Button
            variant="outline"
            className="w-full md:w-auto"
            onClick={() => window.open('https://wa.me/905010321001', '_blank')}
          >
            Teknik Destek
          </Button>
        </Card>
      </div>
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0">
        <Check className="h-5 w-5 text-red-500" />
      </div>
      <span className="text-gray-600">{text}</span>
    </div>
  );
}

function PackageItem({ title, description }: { title: string; description: string }) {
  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </Card>
  );
}