import { Switch, Route, useLocation, Redirect } from "wouter";
import LoginPage from "@/pages/LoginPage";
import ProfilePage from "@/pages/ProfilePage";
import VINPage from "@/pages/VINPage";
import KilometrePage from "@/pages/KilometrePage";
import ProgramUsers from "@/pages/ProgramUsers";
import PanelUsersPage from "@/pages/PanelUsers";
import AyarlarPage from "@/pages/AyarlarPage";
import RaporlarPage from "@/pages/RaporlarPage";
import BayilerPage from "@/pages/BayilerPage";
import BakiyeYonetimi from "@/pages/BakiyeYonetimi";
import Panel from "@/pages/Panel";
import FirmalarPage from "@/pages/Firmalar";
import RolesPage from "@/pages/RolesPage";
import LocationSettings from "@/pages/LocationSettings";
import OdemeBasarili from "@/pages/OdemeBasarili";
import KomisyonYonetimi from "@/pages/KomisyonYonetimi";
import CihazSatislari from "@/pages/CihazSatislari";
import CihazSatinAl from "@/pages/CihazSatinAl";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout/Layout";
import OdemeYapIyzico from "./pages/OdemeYapIyzico";
import { useEffect, useState } from "react";
import BlogEklePage from "./pages/BlogEklePage";
import axios from "axios";

// Yeni ProtectedRoute bileşeni - her sayfa için izin kontrolü yapar
const ProtectedRoute = ({ component: Component, path, ...rest }) => {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      // Super Admin her sayfaya erişebilir
      if (user?.role === "Super Admin") {
        setHasPermission(true);
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`/api/roles/rolekontrol?role=${user?.role}`);
        
        if (response.data.success) {
          const permissions = response.data.data;
          
          // Path'den sayfa/panel adını çıkar
          const pageName = getPageNameFromPath(path);
          
          // İzin kontrolü: Eğer sayfa izinlerde varsa, view iznine bakılır
          // İzinlerde yoksa, varsayılan olarak erişime izin verilir
          if (pageName in permissions) {
            // Sayfa izinlerde var, view iznine bak
            if (permissions[pageName]?.view) {
              setHasPermission(true);
            } else {
              setHasPermission(false);
            }
          } else {
            // Sayfa izinlerde yok, varsayılan olarak erişime izin ver
            setHasPermission(true);
          }
        } else {
          setHasPermission(false);
        }
      } catch (error) {
        console.error("Permission check error:", error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      checkPermission();
    } else {
      setLoading(false);
      setHasPermission(false);
    }
  }, [user, path]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="animate-spin">Loading...</div>
      </div>
    );
  }

  if (!hasPermission) {
    return <AccessDenied />;
  }

  return <Component {...rest} />;
};

// Path'den sayfa adını çıkarmak için yardımcı fonksiyon
function getPageNameFromPath(path) {
  // Path'i / ile böl ve boş segmentleri filtrele
  const segments = path.split('/').filter(segment => segment !== '');
  
  // İlk segment'i al (path'e göre düzenlenebilir)
  const segment = segments[0] || '';
  
  // Path'e göre doğru permission key'ini bul
  const pathMapping = {
    '': 'Panel',
    'panel': 'Panel',
    'firmalar': 'Firmalar',
    'bayiler': 'Bayiler',
    'bakiye': 'Bakiye-Yonetimi',
    'komisyon': 'Komisyon-Yonetimi',
    'roller': 'Roller',
    'kullanicilar': 'Program-Kullanicilari',
    'panel-users': 'Panel-Kullanicilari',
    'blog-ekle': 'BlogEkle',
    'cihaz-satislari': 'Cihaz-Satislari',
    'cihaz-satin-al': 'Cihaz-Satin-Al',
    'ayarlar': 'Ayarlar',
    'profil': 'Profil',
    'vinreader': 'VIN-Hacker',
    'kilometre': 'Kilometre-Hacker',
    'raporlar': 'Raporlar',
    'odeme-basarili': 'OdemeBasarili',
    'odeme-yap-iyzico': 'OdemeYapIyzico'
  };
  
  return pathMapping[segment] || segment;
}

function App() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to login if user is not authenticated and not already on login page
    if (!isLoading && !user && location !== "/login") {
      setLocation("/login");
    }
  }, [user, isLoading, location, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="animate-spin">Loading...</div>
      </div>
    );
  }

  // Login sayfası yönetimi
  if (location === "/login") {
    if (user) {
      return <Redirect to="/panel" />;
    }
    return <LoginPage />;
  }

  // Kullanıcı giriş yapmadıysa
  if (!user) {
    return null; // useEffect ile login'e yönlendirilecek
  }

  // Tüm sayfalar için routes dizisi
  const allRoutes = [
    { path: "/", component: Panel },
    { path: "/panel", component: Panel },
    { path: "/profil", component: ProfilePage },
    { path: "/vinreader", component: VINPage },
    { path: "/kilometre", component: KilometrePage },
    { path: "/ayarlar", component: AyarlarPage },
    { path: "/ayarlar/lokasyonlar", component: LocationSettings },
    { path: "/raporlar", component: RaporlarPage },
    { path: "/bakiye", component: BakiyeYonetimi },
    { path: "/odeme-basarili", component: OdemeBasarili },
    { path: "/odeme-yap-iyzico", component: OdemeYapIyzico },
    { path: "/firmalar", component: FirmalarPage },
    { path: "/kullanicilar", component: ProgramUsers },
    { path: "/panel-users", component: PanelUsersPage },
    { path: "/blog-ekle", component: BlogEklePage },
    { path: "/bayiler", component: BayilerPage },
    { path: "/komisyon", component: KomisyonYonetimi },
    { path: "/roller", component: RolesPage },
    { path: "/cihaz-satislari", component: CihazSatislari },
    { path: "/cihaz-satin-al", component: CihazSatinAl }
  ];

  return (
    <Layout>
      <Switch>
        {/* Tüm sayfalar için ProtectedRoute kullanılır */}
        {allRoutes.map(route => (
          <Route key={route.path} path={route.path}>
            <ProtectedRoute component={route.component} path={route.path} />
          </Route>
        ))}
        
        {/* 404 sayfası */}
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function AccessDenied() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">Erişim Reddedildi</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Bu sayfayı görüntülemek için yeterli yetkiniz bulunmamaktadır.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Sayfa Bulunamadı</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            İstenen sayfa bulunamadı.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;