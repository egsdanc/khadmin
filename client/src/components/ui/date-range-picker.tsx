import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { tr, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerWithRangeProps {
  className?: string;
  date?: DateRange | undefined;
  setDate?: (date: DateRange | undefined) => void;
  selected?: DateRange | undefined;
  onSelect?: (date: DateRange | undefined) => void;
  singleDate?: boolean;
}

export function DatePickerWithRange({
  className,
  date,
  setDate,
  selected,
  onSelect,
  singleDate = false,
}: DatePickerWithRangeProps) {
  const { language } = useLanguage();
  const currentLocale = language === 'en' ? enUS : tr;
  
  const currentDate = selected || date;
  const currentSetDate = onSelect || setDate;

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !currentDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {currentDate?.from ? (
              singleDate ? (
                format(currentDate.from, "dd.MM.yyyy", { locale: currentLocale })
              ) : currentDate.to ? (
                <>
                  {format(currentDate.from, "dd.MM.yyyy", { locale: currentLocale })} -{" "}
                  {format(currentDate.to, "dd.MM.yyyy", { locale: currentLocale })}
                </>
              ) : (
                format(currentDate.from, "dd.MM.yyyy", { locale: currentLocale })
              )
            ) : (
              <span>{language === 'en' ? (singleDate ? 'Select date' : 'Select date range') : (singleDate ? 'Tarih seçin' : 'Tarih aralığı seçin')}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode={singleDate ? "single" : "range"}
            defaultMonth={currentDate?.from}
            selected={currentDate}
            onSelect={currentSetDate}
            numberOfMonths={singleDate ? 1 : 2}
            locale={currentLocale}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
