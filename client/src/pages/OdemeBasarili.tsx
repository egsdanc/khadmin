import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function OdemeBasarili() {
  return (
    <div className="justify-center min-h-screen bg-gray-50 p-4"> {/* flex */}
    <Card className="shadow-lg">    {/*  w-full max-w-md  */}
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="rounded-full bg-green-50 p-3">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">Başarılı!</h1>
              <p className="text-gray-600">Ödemeniz başarıyla gerçekleştirildi.</p>
            </div>
            
            <div className="border-t border-gray-200 w-full my-4 pt-4">
              <p className="text-sm text-gray-500 mb-6">
                Satın alım detayları e-posta adresinize gönderilecektir.
              </p>
            </div>
            
            {/* <div className="w-full space-y-3">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Siparişlerime Git
              </Button>
              <Button variant="outline" className="w-full">
                Alışverişe Devam Et
              </Button>
            </div> */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}