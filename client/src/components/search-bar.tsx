import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

export interface SearchCriteria {
  query: string;
  field: "all" | "title" | "content" | "tags" | "metadata";
  dateRange: DateRange | undefined;
  caseSensitive: boolean;
  selectedTags: string[];
}

interface SearchBarProps {
  criteria: SearchCriteria;
  onCriteriaChange: (criteria: SearchCriteria) => void;
  availableTags: string[];
}

export function SearchBar({ criteria, onCriteriaChange, availableTags }: SearchBarProps) {
  const [open, setOpen] = useState(false);

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
            <SelectItem value="metadata">Metadata</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="case-sensitive"
            checked={criteria.caseSensitive}
            onCheckedChange={(checked) =>
              onCriteriaChange({ ...criteria, caseSensitive: checked })
            }
          />
          <Label htmlFor="case-sensitive">Case Sensitive</Label>
        </div>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="justify-between"
            >
              {criteria.selectedTags.length > 0
                ? `${criteria.selectedTags.length} tags selected`
                : "Filter by tags"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput placeholder="Search tags..." />
              <CommandEmpty>No tags found.</CommandEmpty>
              <CommandGroup className="max-h-[200px] overflow-auto">
                {availableTags.map((tag) => (
                  <CommandItem
                    key={tag}
                    value={tag}
                    onSelect={() => {
                      const updatedTags = criteria.selectedTags.includes(tag)
                        ? criteria.selectedTags.filter((t) => t !== tag)
                        : [...criteria.selectedTags, tag];
                      onCriteriaChange({ ...criteria, selectedTags: updatedTags });
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        criteria.selectedTags.includes(tag)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {tag}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {criteria.selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {criteria.selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer"
              onClick={() =>
                onCriteriaChange({
                  ...criteria,
                  selectedTags: criteria.selectedTags.filter((t) => t !== tag),
                })
              }
            >
              {tag}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onCriteriaChange({
                    ...criteria,
                    selectedTags: criteria.selectedTags.filter((t) => t !== tag),
                  });
                }}
              >
                ×
              </Button>
            </Badge>
          ))}
        </div>
      )}

      <DatePickerWithRange
        date={criteria.dateRange}
        onDateChange={(date) =>
          onCriteriaChange({ ...criteria, dateRange: date })
        }
      />
    </div>
  );
}
