import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

const errorMessageMap: Record<string, string> = {
  'The invoice id already processed': 'Bu fatura numarası ile daha önce ödeme yapılmış. Lütfen yeni bir sipariş oluşturun veya destek ile iletişime geçin.',
  'Card is not valid': 'Kart bilgileri geçersiz. Lütfen kart bilgilerinizi kontrol edin.',
  'Insufficient funds': 'Kartınızda yeterli bakiye bulunmamaktadır.',
  'Invalid card number': 'Kart numarası geçersiz.',
  'Invalid cvv': 'CVV kodu geçersiz.',
  'Invalid expiry date': 'Son kullanma tarihi geçersiz.',
  '3D authentication failed': '3D Secure doğrulaması başarısız oldu.',
  'Authentication unavailable (DS)': 'Kredi kartı bilgileriniz hatalıdır. Lütfen kart bilgilerinizi kontrol edip tekrar deneyiniz.',
  '41': 'Kredi kartı bilgileriniz hatalıdır. Lütfen kart bilgilerinizi kontrol edip tekrar deneyiniz.',
  // Diğer hata mesajları eklenebilir
};

function OdemeHatasi() {
  const [, setLocation] = useLocation();
  const [searchParams, setSearchParams] = useState<URLSearchParams>(new URLSearchParams(window.location.search));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearchParams(params);
    
    const status = params.get('status');
    const invoice_id = params.get('invoice_id');
    const error_code = params.get('error_code');
    const error_message = params.get('error_message');
    const amount = params.get('amount');
    
    console.log('Payment error data:', { status, invoice_id, error_code, error_message, amount });
  }, []);

  const status = searchParams.get('status');
  const invoice_id = searchParams.get('invoice_id');
  const error_code = searchParams.get('error_code');
  const error_message = searchParams.get('error_message');
  const amount = searchParams.get('amount');

  const errorMessageTr = error_code && errorMessageMap[error_code]
    ? errorMessageMap[error_code]
    : error_message && errorMessageMap[error_message]
      ? errorMessageMap[error_message]
      : 'Ödeme işlemi sırasında bir hata oluştu. Lütfen kart bilgilerinizi kontrol edip tekrar deneyiniz.';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-lg w-full border-t-4 border-red-600">
        <div className="flex flex-col items-center">
          <svg className="w-16 h-16 text-red-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
          </svg>
          <h1 className="text-2xl font-bold text-red-700 mb-2">Ödeme Başarısız</h1>
          <p className="text-gray-700 text-center mb-4">
            {errorMessageTr}
          </p>
          <div className="bg-gray-100 rounded-md p-4 w-full mb-4 text-sm text-gray-800">
            <div className="flex flex-wrap gap-2 justify-between">
              <span><span className="font-semibold">Fatura No:</span> {invoice_id || '-'}</span>
              <span><span className="font-semibold">Tutar:</span> {amount ? `${amount} TL` : '-'}</span>
            </div>
            <div className="flex flex-wrap gap-2 justify-between mt-2">
              <span><span className="font-semibold">Hata Kodu:</span> {error_code || '-'}</span>
              <span><span className="font-semibold">Durum:</span> {status === '0' ? 'Başarısız' : status === '1' ? 'Başarılı' : '-'}</span>
            </div>
          </div>
          <div className="text-gray-600 text-sm mb-6 text-center">
            Lütfen bilgilerinizi kontrol edin. Sorun devam ederse <a href="mailto:kilometrehacker@gmail.com" className="text-blue-600 underline">destek ekibimizle</a> iletişime geçebilirsiniz.
          </div>
          <div className="flex gap-4 w-full">
            <button 
              onClick={() => setLocation('/panel')} 
              className="flex-1 py-2 px-4 rounded bg-blue-600 text-white font-semibold text-center hover:bg-blue-700 transition"
            >
              Ana Sayfaya Dön
            </button>
            <button 
              onClick={() => setLocation('/bakiye/bakiye-yukle')} 
              className="flex-1 py-2 px-4 rounded bg-gray-200 text-gray-800 font-semibold text-center hover:bg-gray-300 transition"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OdemeHatasi; 