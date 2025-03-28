import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface Company {
  id: number;
  name: string;
  firma_unvan: string;
  email: string;
  telefon: string | null;
  adres: string | null;
  vergi_dairesi: string | null;
  vergi_no: string | null;
  tc_no: string | null;
  iban: string;
  durum: string;
}

interface ApiResponse {
  success: boolean;
  data: Company[];
}

export function CompanyList() {
  const { data: response, isLoading, error } = useQuery<ApiResponse>({
    queryKey: ["/api/companies"],
  });

  const companies = response?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">
        Hata: {error instanceof Error ? error.message : "Firmalar yüklenirken bir hata oluştu"}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Firma Adı</TableHead>
            <TableHead>Şirket Ünvanı</TableHead>
            <TableHead>E-posta</TableHead>
            <TableHead>Telefon</TableHead>
            <TableHead>Vergi Dairesi</TableHead>
            <TableHead>Durum</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => (
            <TableRow key={company.id}>
              <TableCell>{company.name}</TableCell>
              <TableCell>{company.firma_unvan}</TableCell>
              <TableCell>{company.email}</TableCell>
              <TableCell>{company.telefon || '-'}</TableCell>
              <TableCell>{company.vergi_dairesi || '-'}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  company.durum === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {company.durum === 'active' ? 'Aktif' : 'Pasif'}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}