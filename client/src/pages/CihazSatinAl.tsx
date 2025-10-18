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
import { useLanguage } from "@/contexts/LanguageContext";

export default function CihazSatinAl() {
  const { t } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-red-50 via-rose-50 to-red-100 rounded-2xl p-8 mb-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-rose-600">
                {t('mileage-hacker-device')}
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                {t('mileage-device-description')}
              </p>
              <div className="bg-white/80 backdrop-blur rounded-lg p-6 mb-6">
                <div className="text-3xl font-bold text-red-600 mb-2">60.000 ₺</div>
                <p className="text-sm text-gray-500">{t('vat-included')}</p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className="w-full md:w-auto bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                  >
                    {t('buy-now')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{t('order-information')}</DialogTitle>
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
          <h2 className="text-2xl font-bold mb-6">{t('why-mileage-hacker-device')}</h2>
          <div className="prose max-w-none text-gray-600">
            <p className="mb-4">
              {t('device-description-1')}
            </p>
            <p className="mb-4">
              {t('device-description-2')}
            </p>
            <p>
              {t('device-description-3')}
            </p>
          </div>
        </div>

        {/* Kimler İçin Uygun */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">{t('who-is-it-for')}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <PackageItem
              title={t('individual-users')}
              description={t('individual-users-desc')}
            />
            <PackageItem
              title={t('auto-expertise-companies')}
              description={t('auto-expertise-companies-desc')}
            />
            <PackageItem
              title={t('dealers-and-car-companies')}
              description={t('dealers-and-car-companies-desc')}
            />
          </div>
        </div>

        {/* Özellikler */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">{t('device-features')}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <FeatureItem text={t('feature-1')} />
              <FeatureItem text={t('feature-2')} />
              <FeatureItem text={t('feature-3')} />
              <FeatureItem text={t('feature-4')} />
              <FeatureItem text={t('feature-5')} />
              <FeatureItem text={t('feature-6')} />
            </div>
            <div className="space-y-4">
              <FeatureItem text={t('feature-7')} />
              <FeatureItem text={t('feature-8')} />
              <FeatureItem text={t('feature-9')} />
              <FeatureItem text={t('feature-10')} />
              <FeatureItem text={t('feature-11')} />
              <FeatureItem text={t('feature-12')} />
            </div>
          </div>
        </div>

        {/* Kutu İçeriği */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">{t('package-contents')}</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <PackageItem
              title={t('package-item-1')}
              description={t('package-item-1-desc')}
            />
            <PackageItem
              title={t('package-item-2')}
              description={t('package-item-2-desc')}
            />
            <PackageItem
              title={t('package-item-3')}
              description={t('package-item-3-desc')}
            />
            <PackageItem
              title={t('package-item-4')}
              description={t('package-item-4-desc')}
            />
          </div>
        </div>

        {/* Garanti ve Destek */}
        <Card className="p-6 bg-gradient-to-br from-red-50 to-rose-50">
          <h2 className="text-2xl font-bold mb-4">{t('warranty-and-support')}</h2>
          <p className="text-gray-600 mb-4">
            {t('warranty-description')}
          </p>
          <Button
            variant="outline"
            className="w-full md:w-auto"
            onClick={() => window.open('https://wa.me/905010321001', '_blank')}
          >
            {t('technical-support')}
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