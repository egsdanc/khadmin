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
import { useEffect } from "react";
import BlogEklePage from "./pages/BlogEklePage";

// Protect routes component to only allow admin access
const AdminRoute = ({ component: Component, ...rest }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin" || user?.role === "Super Admin";
  
  if (!isAdmin) {
    return <AccessDenied />;
  }
  
  return <Component {...rest} />;
};

function App() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const isAdmin = user?.role === "Admin" || user?.role === "Super Admin";
  const isSuperAdmin = user?.role === "Super Admin";
  const isBayi = user?.role === "Bayi";

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

  // For login page
  if (location === "/login") {
    // If user is already logged in and tries to access login page, redirect to panel
    if (user) {
      return <Redirect to="/panel" />;
    }
    return <LoginPage />;
  }

  // For all other routes, require authentication
  if (!user) {
    return null; // useEffect will handle redirect to login
  }

  // User is authenticated, show the protected routes
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Panel} />
        <Route path="/panel" component={Panel} />
        <Route path="/firmalar">
          {isAdmin ? <FirmalarPage /> : <AccessDenied />}
        </Route>
        <Route path="/profil" component={ProfilePage} />
        <Route path="/vinreader" component={VINPage} />
        <Route path="/kilometre" component={KilometrePage} />
        <Route path="/kullanicilar">
          {isAdmin ? <ProgramUsers /> : <AccessDenied />}
        </Route>
        <Route path="/panel-users">
          {isAdmin ? <PanelUsersPage /> : <AccessDenied />}
        </Route>
        <Route path="/blog-ekle">
          {isAdmin ? <BlogEklePage/> :  <AccessDenied />}
        </Route>
        <Route path="/ayarlar" component={AyarlarPage} />
        <Route path="/ayarlar/lokasyonlar" component={LocationSettings} />
        <Route path="/raporlar" component={RaporlarPage} />
        <Route path="/bayiler">
          {isAdmin ? <BayilerPage /> : <AccessDenied />}
        </Route>
        <Route path="/bakiye" component={BakiyeYonetimi} />
        <Route path="/komisyon">
          {isAdmin ? <KomisyonYonetimi /> : <AccessDenied />}
        </Route>
        <Route path="/roller">
          {isAdmin ? <RolesPage /> : <AccessDenied />}
        </Route>
        <Route path="/cihaz-satislari">
          {isAdmin ? <CihazSatislari /> : <AccessDenied />}
        </Route>
        <Route path="/cihaz-satin-al">
          {isAdmin ? <CihazSatinAl /> : <AccessDenied />}
        </Route>
        <Route path="/odeme-basarili" component={OdemeBasarili} />
        <Route path="/odeme-yap-iyzico" component={OdemeYapIyzico} />
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