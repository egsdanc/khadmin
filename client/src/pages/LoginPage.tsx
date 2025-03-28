import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setFormError(null);

    try {
      const formData = new FormData(event.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      if (!email || !password) {
        setFormError("Lütfen tüm alanları doldurun.");
        return;
      }

      console.log("Login attempt:", { email });
      const result = await login({ email, password });

      if (!result.ok) {
        setFormError(result.message);
        toast({
          variant: "destructive",
          title: "Giriş başarısız",
          description: result.message,
        });
        return;
      }

      toast({
        title: "Giriş başarılı",
        description: "Yönlendiriliyorsunuz...",
      });

      // Başarılı girişten sonra panel sayfasına yönlendir
      setLocation("/panel");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Giriş başarısız",
        description: "Beklenmeyen bir hata oluştu",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Sol taraf - Mobilde gizli, tablet ve desktop'ta görünür */}
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-900 relative flex-col p-10">
        <div className="relative z-20 flex items-center text-lg font-medium text-white">
          <Icons.logo className="mr-2 h-6 w-6" />
          Kilometre Hacker
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg text-white">
              Araç kilometre ve VIN bilgilerini güvenle sorgulayın.
            </p>
          </blockquote>
        </div>
      </div>

      {/* Sağ taraf - Form */}
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[440px]">
          <Card className="border-0 sm:border shadow-none sm:shadow">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl text-center">Giriş Yap</CardTitle>
              <CardDescription className="text-center">
                Sisteme erişmek için giriş yapın
              </CardDescription>
            </CardHeader>
            <form onSubmit={onSubmit}>
              <CardContent className="grid gap-4">
                {formError && (
                  <div className="text-sm text-destructive text-center">
                    {formError}
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={isLoading}
                    required
                    className="h-11"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Şifre</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    disabled={isLoading}
                    required
                    className="h-11"
                  />
                </div>
              </CardContent>
              <CardFooter className="pb-6">
                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={isLoading}
                >
                  {isLoading && (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Giriş Yap
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}