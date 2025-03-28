import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Kilometre Test', value: 1 },
  { name: 'VIN Test', value: 1 },
];

export function TestDistribution() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" name="Test Sayısı" fill="#2563eb" />
      </BarChart>
    </ResponsiveContainer>
  );
}
