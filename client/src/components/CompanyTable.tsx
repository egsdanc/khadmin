import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

const companies = [
  {
    name: "Garanti Arabam",
    tests: 450,
    revenue: "202.500,00",
    companyShare: "22.500,00",
    companyVat: "4.500,00",
    adminShare: "4.500,00",
    adminVat: "900,00",
  },
  {
    name: "General Oto Ekspertiz",
    tests: 420,
    revenue: "189.000,00",
    companyShare: "21.000,00",
    companyVat: "4.200,00",
    adminShare: "4.200,00",
    adminVat: "840,00",
  },
  {
    name: "Dynobil",
    tests: 400,
    revenue: "180.000,00",
    companyShare: "20.000,00",
    companyVat: "4.000,00",
    adminShare: "4.000,00",
    adminVat: "800,00",
  },
];

export function CompanyTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Firma</TableHead>
          <TableHead className="text-right">Test Sayısı</TableHead>
          <TableHead className="text-right">Bayi Geliri</TableHead>
          <TableHead className="text-right">Firma Payı</TableHead>
          <TableHead className="text-right">Firma KDV</TableHead>
          <TableHead className="text-right">Admin Payı</TableHead>
          <TableHead className="text-right">Admin KDV</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {companies.map((company) => (
          <TableRow key={company.name}>
            <TableCell>{company.name}</TableCell>
            <TableCell className="text-right">{company.tests}</TableCell>
            <TableCell className="text-right">
              {formatCurrency(company.revenue)}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(company.companyShare)}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(company.companyVat)}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(company.adminShare)}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(company.adminVat)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}