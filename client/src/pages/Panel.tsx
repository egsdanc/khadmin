import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, CreditCard, Car, ClipboardCheck, DollarSign, Building2, Gauge, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer
} from 'recharts';
import { format } from "date-fns";
import { tr } from 'date-fns/locale';
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";

// Örnek veriler
const SAMPLE_DATA = {
  komisyonData: [
    { tarih: "01 Oca", komisyon: 1500 },
    { tarih: "02 Oca", komisyon: 2200 },
    { tarih: "03 Oca", komisyon: 1800 },
    { tarih: "04 Oca", komisyon: 2400 },
    { tarih: "05 Oca", komisyon: 2100 },
    { tarih: "06 Oca", komisyon: 2800 },
    { tarih: "07 Oca", komisyon: 3200 },
  ],
  firmaBayiData: [
    { name: "Firma A", value: 12 },
    { name: "Firma B", value: 8 },
    { name: "Firma C", value: 6 },
    { name: "Firma D", value: 4 },
  ],
  bakiyeData: [
    { name: "Bayi 1", bakiye: 15000 },
    { name: "Bayi 2", bakiye: 12000 },
    { name: "Bayi 3", bakiye: 9000 },
    { name: "Bayi 4", bakiye: 7500 },
    { name: "Bayi 5", bakiye: 6000 },
  ]
};

const COLORS = {
  primary: '#6366f1',
  secondary: '#ec4899',
  success: '#22c55e',
  warning: '#eab308',
  info: '#0ea5e9',
  purple: '#a855f7',
  orange: '#f97316',
  teal: '#14b8a6'
};

const chartColors = {
  'Garantili Arabam': '#ef4444', // kırmızı
  'Dynobil': '#f97316', // turuncu
  'General': '#3b82f6', // mavi
  'Galeri': '#6b7280', // gri
  'Bireysel': '#818cf8' // varsayılan mor
};

const Panel = () => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  // Add query for total commission
  const user = useAuth();
  const queryClient = useQueryClient();


  useEffect(() => {
    if (user) {
      // Invalidate all queries to force refresh when user changes
      queryClient.invalidateQueries();
    }
  }, [user, queryClient]);

  const { data: totalCommissionData } = useQuery({
    queryKey: ["/api/raporlar/total-commission", user?.role, user?.id], // Spesifik alanları ekleyelim
    queryFn: async () => {
      const response = await fetch("/api/raporlar/total-commission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user), // Tüm user nesnesini gönderiyoruz
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch total commission");
      }
  
      return response.json();
    },
    enabled: !!user, // user nesnesi varsa sorguyu çalıştır
  });
  
  
  // Add query for active companies count
  const { data: companiesData } = useQuery<{ success: boolean; data: { activeCount: number } }>({
    queryKey: ["/api/companies/stats"],
    queryFn: async () => {
      const response = await fetch("/api/companies/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch company stats");
      }
      return response.json();
    }
  });

  const activeCompaniesCount = companiesData?.data?.activeCount || 0;

  // Add new query for active dealers count
  const { data: dealersData } = useQuery<{ success: boolean; data: { activeCount: number, formattedTotalBalance: string } }>({
    queryKey: ["/api/dealers/stats"],
    queryFn: async () => {
      const params = new URLSearchParams({
        user: JSON.stringify(user), // Send the entire user object
      });
      const response = await fetch(`/api/dealers/stats?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch dealer stats");
      }
      return response.json();
    }
  });

  const activeDealersCount = dealersData?.data?.activeCount || 0;

  // Add query for companies distribution
  const { data: distributionData } = useQuery<{ success: boolean; data: Array<{ firma_name: string; bayi_count: number }> }>({
    queryKey: ["/api/companies/distribution"],
    queryFn: async () => {
      const response = await fetch("/api/companies/distribution");
      if (!response.ok) {
        throw new Error("Failed to fetch company distribution");
      }
      return response.json();
    }
  });

  const companyDistributionData = distributionData?.data?.map(item => ({
    name: item.firma_name,
    value: item.bayi_count
  })) || [];

  // Add new query for kilometre test count


  const { data: kilometreData } = useQuery<{ success: boolean; data: { totalTests: number } }>({
    queryKey: ["/api/kilometre/stats", user], // Cache için önemli
    queryFn: async () => {
      const params = new URLSearchParams({
        user: JSON.stringify(user), // Tüm user nesnesini gönderiyoruz
      });
  
      const response = await fetch(`/api/kilometre/stats?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch kilometre stats");
      }
      return response.json();
    }
  });
  

  const totalKilometreTests = kilometreData?.data?.totalTests || 0;

  // Add query for VIN test count
  const { data: vinData } = useQuery<{ success: boolean; data: { totalTests: number } }>({
    queryKey: ["/api/vinreader/stats"],
    queryFn: async () => {

      const params = new URLSearchParams({
        user: JSON.stringify(user), // Tüm user nesnesini gönderiyoruz
      });
      console.log("vvvccc",user)
      const response = await fetch(`/api/vinreader/stats?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch VIN stats");
      }
      return response.json();
    }
  });
  const totalVinTests = vinData?.data?.totalTests || 0;

  // Add query for top balance dealers
  const { data: topBalanceDealers = { success: false, data: [] } } = useQuery({
    queryKey: ['/api/bayiler/top-balance'],
    queryFn: async () => {
      const response = await fetch('/api/bayiler/top-balance');
      if (!response.ok) throw new Error('En yüksek bakiyeli bayiler alınamadı');
      return response.json();
    }
  });

  // Add query for total test fees
  const { data: totalFeesData, isLoading: isLoadingFees } = useQuery<{
    success: boolean;
    data: {
      totalFees: number;
      formattedTotalFees: string;
    }
  }>({
    queryKey: ["/api/kilometre/total-fees"],
    queryFn: async () => {
      const params = new URLSearchParams({
        user: JSON.stringify(user), // Send the entire user object
      });
      const response = await fetch(`/api/kilometre/total-fees?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Test ücretleri toplamı alınamadı");
      }
      return response.json();
    }
  });

  const totalTestFees = totalFeesData?.data?.formattedTotalFees || "0,00 ₺";

  const { data: satislarToplam } = useQuery<{
    success: boolean;
    data: { total: number; formattedTotal: string };
  }>({
    queryKey: ["/api/cihaz-satislari/toplam", user],
    queryFn: async () => {
      const params = new URLSearchParams({
        user: JSON.stringify(user), // Send the entire user object
      });
      
      const response = await fetch(`/api/cihaz-satislari/toplam?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch total sales");
      }
      
      return response.json();
    },
  });

  // Update stats array with real data
  const allStats = [
    {
      title: "Toplam Komisyon",
      value: totalCommissionData?.data?.formattedTotalCommission || "0,00 ₺",
      icon: TrendingUp,
      description: "Tüm zamanlar",
      color: COLORS.primary
    },
    {
      title: "Cihaz Satış Toplamı",
      value: satislarToplam?.data?.formattedTotal || "0,00 ₺",
      icon: DollarSign,
      description: "Toplam satış tutarı",
      color: COLORS.secondary
    },
    {
      title: "Toplam Km Test",
      value: totalKilometreTests.toString(),
      icon: Gauge,
      description: "Tüm zamanlar",
      color: COLORS.success
    },
    {
      title: "Aktif Bayiler",
      value: activeDealersCount.toString(),
      icon: Users,
      description: "Toplam bayi sayısı",
      color: COLORS.warning
    },
    {
      title: "Toplam Bakiye",
      value: dealersData?.data?.formattedTotalBalance || "0,00 ₺",
      icon: CreditCard,
      description: user.user.role === "Bayi" ? "Bayi Bakiyesi" :"Tüm bayilerin bakiyesi"  ,
      color: COLORS.info
    },
    {
      title: "Toplam Test Ücreti",
      value: isLoadingFees ? "Yükleniyor..." : (totalFeesData?.data?.formattedTotalFees || "0,00 ₺"),
      icon: ClipboardCheck,
      description: "Toplam test geliri",
      color: COLORS.purple
    },
    {
      title: "Aktif Firmalar",
      value: activeCompaniesCount.toString(),
      icon: Building2,
      description: "Toplam firma sayısı",
      color: COLORS.orange
    },
    {
      title: "Toplam VIN Test",
      value: totalVinTests.toString(),
      icon: Car,
      description: "VIN test sayısı",
      color: COLORS.teal
    }
  ];
  
  console.log( "ufffuu",user.user.role)
  const stats = allStats.filter(stat => {
    if (
      ["Cihaz Satış Toplamı", "Aktif Bayiler", "Aktif Firmalar", "Toplam Test Ücreti"].includes(stat.title) &&
      !["Admin", "Super Admin"].includes(user.user.role)
    ) {
      return false; // Eğer rol uygun değilse, bu elemanı filtrele
    }
    return true;
  });

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white">
      <motion.div
        initial="hidden"
        animate="show"
        variants={container}
        className="max-w-6xl mx-auto space-y-6"
      >
        {/* Header */}
        <motion.div variants={item} className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Panel
          </h1>
          <p className="text-gray-500 text-lg">
            Sistem yönetimi ve istatistikleri burada görüntüleyebilirsiniz.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div key={stat.title} variants={item}>
              <Card className="overflow-hidden bg-white border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                  <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                  <p className="text-xs text-gray-500">{stat.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        {user.user.role === "Admin" || user.user.role === "Super Admin" ? 
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-12">
          {/* Line Chart */}
          
          <motion.div variants={item} className="lg:col-span-6">
            <Card className="bg-white border-gray-100">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-medium text-gray-700">Komisyon Gelişimi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={SAMPLE_DATA.komisyonData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="tarih"
                        stroke="#6b7280"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        stroke="#6b7280"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${value} ₺`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}
                        formatter={(value: number) => [`${value.toLocaleString('tr-TR')} ₺`, 'Komisyon']}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="komisyon"
                        name="Komisyon (₺)"
                        stroke={COLORS.primary}
                        strokeWidth={2}
                        dot={{ stroke: COLORS.primary, strokeWidth: 2 }}
                        activeDot={{ r: 8, stroke: COLORS.primary, strokeWidth: 2 }}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pie Chart */}
          <motion.div variants={item} className="lg:col-span-6">
            <Card className="bg-white border-gray-100">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-medium text-gray-700">Firma Bayi Dağılımı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full flex flex-col items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={companyDistributionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                      >
                        {companyDistributionData.map((entry) => (
                          <Cell
                            key={`cell-${entry.name}`}
                            fill={chartColors[entry.name as keyof typeof chartColors] || chartColors.Bireysel}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}
                        formatter={(value: number, name: string) => [`${value} bayi`, name]}
                      />
                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        layout="horizontal"
                        wrapperStyle={{
                          paddingTop: '5px',
                          width: '100%'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
: ""}

        {/* Bar Chart */}
        <motion.div variants={item}>
        {user.user.role === "Admin" || user.user.role === "Super Admin" ? 

          <Card className="bg-white border-gray-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium text-gray-700">En Yüksek Bakiyeli Bayiler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topBalanceDealers.data} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      interval={0}
                      tick={{ fontSize: 12 }}
                      height={60}
                      stroke="#6b7280"
                    />
                    <YAxis
                      stroke="#6b7280"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${value.toLocaleString('tr-TR')} ₺`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                      }}
                      formatter={(value: number, name: string, props: any) => [
                        `${value.toLocaleString('tr-TR')} ₺`,
                        `${props.payload.firma || 'Firma Yok'}`
                      ]}
                      labelFormatter={(label) => `Bayi: ${label}`}
                    />
                    <Bar
                      dataKey="value"
                      name="Bakiye (₺)"
                      fill={COLORS.primary}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
                   : ""}
        </motion.div>
  
      </motion.div>
   
    </div>
  );
};

export default Panel;