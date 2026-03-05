import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface DateFilterProps {
  title: string;
  selectedRange: DateRange | undefined;
  onFilterChange: (range: DateRange | undefined) => void;
}

export function DateFilter({ title, selectedRange, onFilterChange }: DateFilterProps) {
  return (
    <div className="flex items-center space-x-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 border-dashed justify-start text-left font-normal",
              !selectedRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {title}
            {selectedRange?.from ? (
              <>
                <span className="mx-2 text-muted-foreground">|</span>
                <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                  {selectedRange.to ? (
                    <>
                      {format(selectedRange.from, "LLL dd")} -{" "}
                      {format(selectedRange.to, "LLL dd")}
                    </>
                  ) : (
                    format(selectedRange.from, "LLL dd")
                  )}
                </Badge>
              </>
            ) : null}
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
                  className="w-full h-8 text-xs" 
                  onClick={() => onFilterChange(undefined)}
                >
                  Clear Date
                </Button>
             </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}