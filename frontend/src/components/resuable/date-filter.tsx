
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";


import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface DateFilterProps {
  title?: string;
  selectedRange: DateRange | undefined;
  onFilterChange: (range: DateRange | undefined) => void;
  disabled?: boolean;
}

export function DateFilter({
  title,
  selectedRange,
  onFilterChange,
  disabled,
}: DateFilterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          disabled={disabled}
          variant="outline"
          size="sm"
          className="h-8 border-dashed w-full lg:w-auto justify-start"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {title}
          
          {selectedRange?.from && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              {/* Mobile view: show a count or dot */}
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                1
              </Badge>
              
              {/* Desktop view: show the actual date */}
              <div className="hidden space-x-1 lg:flex">
                <Badge
                  variant="secondary"
                  className="rounded-sm px-1 font-normal"
                >
                  {selectedRange.to ? (
                    <>
                      {format(selectedRange.from, "LLL dd")} -{" "}
                      {format(selectedRange.to, "LLL dd")}
                    </>
                  ) : (
                    format(selectedRange.from, "LLL dd")
                  )}
                </Badge>
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={selectedRange?.from}
          selected={selectedRange}
          onSelect={onFilterChange}
          numberOfMonths={1}
        />
        {selectedRange?.from && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              className="w-full h-8 text-xs font-normal justify-center"
              onClick={() => onFilterChange(undefined)}
            >
              Clear filters
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}