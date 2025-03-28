import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-4 border-t">
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          Toplam {totalItems} kayıt ({(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} arası)
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Önceki
        </Button>
        <div className="flex items-center gap-1">
          {(() => {
            const pageNumbers = [];
            const addPageButton = (pageNum: number) => (
              <Button
                key={pageNum}
                variant={pageNum === currentPage ? "default" : "ghost"}
                size="sm"
                className="h-8 w-8"
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            );

            // İlk sayfayı her zaman ekle
            pageNumbers.push(addPageButton(1));

            if (currentPage > 3) {
              pageNumbers.push(
                <span key="ellipsis-1" className="px-2">
                  ...
                </span>
              );
            }

            // Mevcut sayfa etrafındaki sayfaları ekle
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
              if (i === 1 || i === totalPages) continue;
              pageNumbers.push(addPageButton(i));
            }

            if (currentPage < totalPages - 2) {
              pageNumbers.push(
                <span key="ellipsis-2" className="px-2">
                  ...
                </span>
              );
            }

            // Birden fazla sayfa varsa son sayfayı ekle
            if (totalPages > 1) {
              pageNumbers.push(addPageButton(totalPages));
            }

            return pageNumbers;
          })()}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Sonraki
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}