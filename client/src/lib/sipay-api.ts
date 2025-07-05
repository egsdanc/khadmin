import { api } from './api';

export interface SipayTokenResponse {
  status_code: number;
  status_description?: string;
  data?: {
    token: string;
    expires_in?: number;
  };
  error?: string;
}

export interface SipayPaymentRequest {
  amount: number;
  bayi_id?: number;
  token?: string;
  customer_info?: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    note?: string;
  };
}

export interface SipayPaymentResponse {
  success: boolean;
  token?: string;
  amount?: number;
  bayi_id?: number;
  message?: string;
  status?: string;
  errorMessage?: string;
  checkoutFormContent?: string;
  conversationId?: string;
}

export interface SipayPaymentStatusResponse {
  success: boolean;
  paymentId: string;
  status: string;
  message?: string;
}

export interface SipayGetPosRequest {
  credit_card: string;
  amount: number;
  currency_code?: string;
  is_recurring?: number;
  is_2d?: number;
  token: string;
}

export interface SipayInstallmentOption {
  installments_number: number;
  amount_to_be_paid: string;
  title?: string;
  card_program?: string;
  card_scheme?: string;
  card_bank?: string;
}

export interface SipayGetPosResponse {
  status_code: number;
  installments?: SipayInstallmentOption[];
  message?: string;
  [key: string]: any;
}

export interface SipayPaySmart3DRequest {
  cc_holder_name: string;
  cc_no: string;
  expiry_month: string;
  expiry_year: string;
  cvv: string;
  currency_code: string;
  installments_number: string;
  invoice_id: string;
  invoice_description: string;
  name: string;
  surname: string;
  total: number;
  unit_price: number;
  quantity: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  cancel_url: string;
  return_url: string;
  bill_email: string;
  bill_phone: string;
  bill_address1: string;
  bill_city: string;
  bill_postcode?: string;
  bill_country: string;
  payment_completed_by: string;
  response_method: string;
  ip: string;
  token: string;
}

export interface SipayDbPaymentRequest {
  invoice_id: string;
  cc_holder_name: string;
  cc_no: string;
  expiry_month: string;
  expiry_year: string;
  cvv: string;
  total: number;
  quantity?: number;
  name: string;
  surname: string;
  currency_code?: string;
  installments_number?: string;
  invoice_description?: string;
  bill_email?: string;
  bill_phone?: string;
  bill_address1?: string;
  bill_address2?: string;
  bill_city?: string;
  bill_postcode?: string;
  bill_state?: string;
  bill_country?: string;
  ip?: string;
  status?: number;
  unit_price?: number;
  bayi_id?: number;
}

export interface SipayDbPaymentResponse {
  success: boolean;
  data?: any;
  message?: string;
}

export const sipayApi = {
  // Token alma - POST /api/sipay/token
  getToken: async (): Promise<SipayTokenResponse> => {
    try {
      console.log('🔄 Sipay token servisine istek atılıyor...');

      const response = await api.post('/sipay/token');

      console.log('📡 Sipay token servisi yanıtı:', response.status);
      console.log('📋 Sipay token yanıtı:', response.data);

      return response.data;
    } catch (error: any) {
      console.error('💥 Sipay token hatası:', error);
      throw error;
    }
  },

  // Sipay payment oluşturma - POST /api/sipay/create-payment
  createPayment: async (paymentData: SipayPaymentRequest): Promise<SipayPaymentResponse> => {
    try {
      console.log('💳 Sipay payment oluşturma isteği:', paymentData);

      const response = await api.post('/sipay/create-payment', paymentData);

      console.log('📡 Sipay payment yanıtı:', response.data);

      return response.data;
    } catch (error: any) {
      console.error('💥 Sipay payment hatası:', error);
      throw error;
    }
  },

  // Payment status kontrolü - GET /api/sipay/payment-status/:paymentId
  getPaymentStatus: async (paymentId: string): Promise<SipayPaymentStatusResponse> => {
    try {
      console.log('📊 Payment status kontrolü:', paymentId);

      const response = await api.get(`/sipay/payment-status/${paymentId}`);

      console.log('📡 Payment status yanıtı:', response.data);

      return response.data;
    } catch (error: any) {
      console.error('💥 Payment status hatası:', error);
      throw error;
    }
  },

  // Sipay getpos - POST /api/sipay-post
  getPos: async (params: {
    credit_card: string;
    amount: number;
    currency_code?: string;
    is_recurring?: number;
    is_2d?: number;
    token: string;
  }): Promise<SipayGetPosResponse> => {
    try {
      const { token, ...body } = params;
      console.log('🔄 Sipay getpos servisine istek atılıyor...', body);
      const response = await api.post('sipay/sipay-post', body, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      console.log('📡 Sipay getpos yanıtı:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('💥 Sipay getpos hatası:', error);
      throw error;
    }
  },

  // Sipay paySmart3D - POST /api/sipay-paySmart3D
  paySmart3D: async (params: SipayPaySmart3DRequest): Promise<any> => {
    try {
      const { token, ...body } = params;
      console.log('🔄 Sipay paySmart3D servisine istek atılıyor...', body);

      // Form oluştur ve submit et (mevcut sayfayı yönlendir)
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/api/sipay/sipay-paySmart3D';
      form.target = '_self'; // Mevcut sayfada aç

      // Authorization header'ı form field olarak ekle
      const authInput = document.createElement('input');
      authInput.type = 'hidden';
      authInput.name = 'authorization';
      authInput.value = `Bearer ${token}`;
      form.appendChild(authInput);

      // Diğer form verilerini ekle
      Object.entries(body).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = typeof value === 'object' ? JSON.stringify(value) : String(value);
        form.appendChild(input);
      });

      // Formu sayfaya ekle ve submit et
      document.body.appendChild(form);
      form.submit();

      console.log('✅ Sipay payment form mevcut sayfada açılıyor...');

      return { success: true, message: 'Payment form redirecting' };
    } catch (error: any) {
      console.error('💥 Sipay paySmart3D hatası:', error);
      throw error;
    }
  },

  // Sipay DB Payment - POST /api/sipay/add-sipaypayment
  sipayDbPayment: async (params: SipayDbPaymentRequest): Promise<SipayDbPaymentResponse> => {
    try {
      console.log('🔄 Sipay DB Payment servisine istek atılıyor...', params);

      const response = await api.post('/sipay/add-sipay-panel-fatura', params);

      console.log('📡 Sipay DB Payment yanıtı:', response.data);

      return response.data;
    } catch (error: any) {
      console.error('💥 Sipay DB Payment hatası:', error);
      throw error;
    }
  }
}; 