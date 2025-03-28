import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { useState } from "react";
import { TestDetailsModal } from "./TestDetailsModal";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface Test {
  test_id: number;
  tarih: string;
  plaka: string;
  sase: string;
  motor: string;
  marka: string;
  model: string;
  gosterge_km: number;
  km: string;
  ucret: string;
  aciklama: string;
  firma_adi: string;
  bayi_adi: string;
}

interface ApiResponse {
  success: boolean;
  data: Test[];
}

export function TestList() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterBy, setFilterBy] = useState<"plaka" | "marka">("plaka");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const itemsPerPage = 25;

  const {
    data: response,
    isLoading,
    isError,
    error,
  } = useQuery<ApiResponse>({
    queryKey: ["/api/testler"],
    retry: false,
  });

  const tests = response?.data || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-lg text-muted-foreground">Yükleniyor...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-lg text-red-500">
          Veri yüklenirken bir hata oluştu: {(error as Error).message}
        </div>
      </div>
    );
  }

  const filteredTests = tests.filter((test) => {
    const searchTerm = search.toLowerCase();
    const searchMatch =
      filterBy === "plaka"
        ? test.plaka.toLowerCase().includes(searchTerm)
        : `${test.marka} ${test.model}`.toLowerCase().includes(searchTerm);

    const testDate = new Date(test.tarih);
    const startDateMatch = !startDate || testDate >= new Date(startDate);
    const endDateMatch = !endDate || testDate <= new Date(endDate);

    return searchMatch && startDateMatch && endDateMatch;
  });

  const paginatedTests = filteredTests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredTests.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="grid gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="startDate">
                Başlangıç Tarihi
              </label>
              <Input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="endDate">
                Bitiş Tarihi
              </label>
              <Input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={() => setCurrentPage(1)} className="w-full">
                Sorgula
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="w-full sm:w-auto">
              <Label className="text-sm font-medium">Plaka/Model</Label>
              <Select
                value={filterBy}
                onValueChange={(value: "plaka" | "marka") => setFilterBy(value)}
              >
                <SelectTrigger className="w-full sm:w-[180px] h-11">
                  <SelectValue placeholder="Plaka" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plaka">Plaka</SelectItem>
                  <SelectItem value="marka">Marka/Model</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-auto flex-1">
              <Label className="text-sm font-medium">Arama</Label>
              <Input
                placeholder={
                  filterBy === "plaka"
                    ? "Plaka ile ara..."
                    : "Marka/Model ile ara..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11"
              />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Card>
            <CardContent className="p-0">
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px] whitespace-nowrap">No</TableHead>
                      <TableHead className="whitespace-nowrap">Tarih</TableHead>
                      <TableHead className="whitespace-nowrap">Plaka</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                      <TableHead className="hidden md:table-cell whitespace-nowrap">Marka/Model</TableHead>
                      <TableHead className="hidden md:table-cell whitespace-nowrap">Şase No</TableHead>
                      <TableHead className="hidden md:table-cell whitespace-nowrap">Motor No</TableHead>
                      <TableHead className="hidden md:table-cell whitespace-nowrap">Firma</TableHead>
                      <TableHead className="hidden md:table-cell whitespace-nowrap">Bayi</TableHead>
                      <TableHead className="hidden md:table-cell whitespace-nowrap text-right">Gösterge KM</TableHead>
                      <TableHead className="hidden md:table-cell whitespace-nowrap text-right">Ücret</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTests.map((test, index) => (
                      <TableRow key={test.test_id}>
                        <TableCell className="whitespace-nowrap">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(test.tarih), "dd.MM.yyyy HH:mm")}
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">
                          {test.plaka}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTestId(test.test_id)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="mr-2"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 16v-4" />
                              <path d="M12 8h.01" />
                            </svg>
                            Detay
                          </Button>
                        </TableCell>
                        <TableCell className="hidden md:table-cell whitespace-nowrap">
                          {`${test.marka} ${test.model}`}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {test.sase}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {test.motor}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {test.firma_adi || "-"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {test.bayi_adi || "-"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-right font-mono">
                          {test.gosterge_km}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-right">
                          {test.ucret} TL
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2 mt-4">
            <div className="text-sm text-muted-foreground">
              Toplam {filteredTests.length} kayıttan{" "}
              {(currentPage - 1) * itemsPerPage + 1} -{" "}
              {Math.min(currentPage * itemsPerPage, filteredTests.length)} arası
              gösteriliyor
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Önceki
              </Button>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Sayfa {currentPage} / {totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                Sonraki
              </Button>
            </div>
          </div>
        )}
      </Card>

      <TestDetailsModal
        isOpen={!!selectedTestId}
        onClose={() => setSelectedTestId(null)}
        testId={selectedTestId}
      />
    </div>
  );
}