import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  onConfirm?: (date: Date) => void;
  showConfirm?: boolean;
};

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  const fromYear = props.fromYear ?? 1900;
  const toYear = props.toYear ?? new Date().getFullYear();
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    props.month ?? (props.selected instanceof Date ? props.selected : new Date())
  );

  const MONTHS = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const onMonthSelect = (m: string) => {
    const mi = parseInt(m, 10);
    setCurrentMonth(new Date(currentMonth.getFullYear(), mi, 1));
  };

  const onYearSelect = (y: string) => {
    const yi = parseInt(y, 10);
    setCurrentMonth(new Date(yi, currentMonth.getMonth(), 1));
  };

  const selectedDate = props.selected instanceof Date ? props.selected : undefined;

  return (
    <div className={cn("p-2", className)}>
      <div className="flex items-center gap-2 mb-2">
        <Select onValueChange={onMonthSelect} value={String(currentMonth.getMonth())}>
          <SelectTrigger className="w-28">
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((label, idx) => (
              <SelectItem key={label} value={String(idx)}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={onYearSelect} value={String(currentMonth.getFullYear())}>
          <SelectTrigger className="w-24">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {Array.from({ length: toYear - fromYear + 1 }, (_, i) => fromYear + i).map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {props.showConfirm !== false && selectedDate && (
          <div className="ml-auto">
            <Button size="sm" onClick={() => props.onConfirm?.(selectedDate)}>OK</Button>
          </div>
        )}
      </div>
      <DayPicker
        showOutsideDays={showOutsideDays}
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        captionLayout={"buttons"}
        fromYear={fromYear}
        toYear={toYear}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-2 sm:space-x-4 sm:space-y-0",
          month: "space-y-2",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "sr-only",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.75rem]",
          row: "flex w-full mt-1",
          cell: "h-8 w-8 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(buttonVariants({ variant: "ghost" }), "h-8 w-8 p-0 font-normal aria-selected:opacity-100"),
          day_range_end: "day-range-end",
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside:
            "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        components={{
          IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
          IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
        }}
        {...props}
      />
    </div>
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
