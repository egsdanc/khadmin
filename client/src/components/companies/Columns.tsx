import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Edit } from "lucide-react";

export interface Company {
  id: number;
  name: string;
  firma_unvan: string;
  email: string;
  telefon: string;
  adres: string;
  vergi_dairesi: string;
  vergi_no: string;
  tc_no: string;
  iban: string;
  durum: string;
  test_sayisi: number;
  superadmin_oran: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  bakiye: number;
}

export const columns: ColumnDef<Company>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Firma Adı
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "firma_unvan",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Firma Ünvanı
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "email",
    header: "E-posta",
  },
  {
    accessorKey: "telefon",
    header: "Telefon",
  },
  {
    accessorKey: "vergi_dairesi",
    header: "Vergi Dairesi",
  },
  {
    accessorKey: "vergi_no",
    header: "Vergi No",
  },
  {
    accessorKey: "durum",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Durum
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = row.getValue("durum") as string;
      return (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            status === "active"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {status === "active" ? "Aktif" : "Pasif"}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const company = row.original;

      return (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              console.log("Edit company:", company);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];