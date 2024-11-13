import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";

export interface SearchCriteria {
  query: string;
  field: "all" | "title" | "content" | "tags";
  dateRange: DateRange | undefined;
}

interface SearchBarProps {
  criteria: SearchCriteria;
  onCriteriaChange: (criteria: SearchCriteria) => void;
}

export function SearchBar({ criteria, onCriteriaChange }: SearchBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prompts..."
            value={criteria.query}
            onChange={(e) => 
              onCriteriaChange({ ...criteria, query: e.target.value })
            }
            className="pl-8"
          />
        </div>
        <Select
          value={criteria.field}
          onValueChange={(value: SearchCriteria["field"]) =>
            onCriteriaChange({ ...criteria, field: value })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Search in..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fields</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="content">Content</SelectItem>
            <SelectItem value="tags">Tags</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DatePickerWithRange
        date={criteria.dateRange}
        onDateChange={(date) =>
          onCriteriaChange({ ...criteria, dateRange: date })
        }
      />
    </div>
  );
}
