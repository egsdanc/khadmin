import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';

const data = [
  { month: 'Ocak', revenue: 220000, system: 15000, admin: 12000 },
  { month: 'Şubat', revenue: 210000, system: 14000, admin: 11000 },
  { month: 'Mart', revenue: 205000, system: 13500, admin: 10500 },
  { month: 'Nisan', revenue: 195000, system: 13000, admin: 10000 },
  { month: 'Mayıs', revenue: 200000, system: 13500, admin: 10500 },
  { month: 'Haziran', revenue: 215000, system: 14500, admin: 11500 },
  { month: 'Temmuz', revenue: 225000, system: 15500, admin: 12500 },
  { month: 'Ağustos', revenue: 220000, system: 15000, admin: 12000 },
  { month: 'Eylül', revenue: 210000, system: 14000, admin: 11000 },
  { month: 'Ekim', revenue: 215000, system: 14500, admin: 11500 },
  { month: 'Kasım', revenue: 225000, system: 15500, admin: 12500 },
  { month: 'Aralık', revenue: 230000, system: 16000, admin: 13000 },
];

export function MonthlyChart() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={(value) => formatCurrency(value)} />
        <Tooltip 
          formatter={(value: number) => formatCurrency(value)}
          labelFormatter={(label) => `${label}`}
        />
        <Legend />
        <Bar dataKey="revenue" name="Bayi Geliri" fill="#2563eb" />
        <Bar dataKey="system" name="Sistem Geliri" fill="#7c3aed" />
        <Bar dataKey="admin" name="Emre Şahsen Geliri" fill="#16a34a" />
      </BarChart>
    </ResponsiveContainer>
  );
}
