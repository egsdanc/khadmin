import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CustomPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

export function CustomPagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: CustomPaginationProps) {
  console.log('CustomPagination render:', { currentPage, totalPages, totalItems, itemsPerPage });

  // Don't render if there's only one page or no pages
  if (!totalPages || totalPages <= 1) {
    return null;
  }

  // Calculate the range of page numbers to display
  const pageNumbers: (number | string)[] = [];

  // Always add first page
  pageNumbers.push(1);

  // Add ellipsis and numbers around current page
  if (currentPage > 3) {
    pageNumbers.push("...");
  }

  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
    if (!pageNumbers.includes(i)) {
      pageNumbers.push(i);
    }
  }

  if (currentPage < totalPages - 2) {
    pageNumbers.push("...");
  }

  // Add last page if we have more than one page
  if (totalPages > 1 && !pageNumbers.includes(totalPages)) {
    pageNumbers.push(totalPages);
  }

  const startCount = Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1);
  const endCount = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex-1 text-sm text-muted-foreground">
        <span className="font-medium">
          {startCount} - {endCount}
        </span>{" "}
        / Toplam {totalItems} kayıt
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Önceki sayfa</span>
        </Button>

        <div className="flex -space-x-px">
          {pageNumbers.map((pageNum, idx) =>
            typeof pageNum === "number" ? (
              <Button
                key={idx}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                className={`h-8 min-w-[2rem] ${
                  currentPage === pageNum ? "z-10" : ""
                }`}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            ) : (
              <span
                key={idx}
                className="px-2 py-2 text-sm text-muted-foreground inline-flex items-center"
              >
                {pageNum}
              </span>
            )
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Sonraki sayfa</span>
        </Button>
      </div>
    </div>
  );
}