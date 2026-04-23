'use client'

import React from 'react'
import { format } from "date-fns"
import { Calendar as CalendarIcon, Download, Search, X } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"

export interface FilterPanelProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;

  status: string;
  onStatusChange: (value: string) => void;
  statusOptions?: { label: string; value: string }[];

  provider: string;
  onProviderChange: (value: string) => void;
  providerOptions?: { label: string; value: string }[];

  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;

  onExport?: () => void;
  isExporting?: boolean;
}

export function FilterPanel({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Search...",
  status,
  onStatusChange,
  statusOptions = [],
  provider,
  onProviderChange,
  providerOptions = [],
  dateRange,
  onDateRangeChange,
  onExport,
  isExporting = false,
}: FilterPanelProps) {
  const [openProvider, setOpenProvider] = React.useState(false)

  return (
    <div className="bg-card/50 border border-border rounded-xl p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
      
      {/* Filters Section */}
      <div className="flex flex-1 flex-col md:flex-row gap-4 w-full">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-8 bg-background border-border"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status Dropdown */}
        {statusOptions.length > 0 && (
          <Select
            value={status || "all"}
            onValueChange={(val) => onStatusChange(val === "all" ? "" : val)}
          >
            <SelectTrigger className="w-full md:w-[180px] bg-background border-border">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Provider Searchable Dropdown (Combobox) */}
        {providerOptions.length > 0 && (
          <Popover open={openProvider} onOpenChange={setOpenProvider}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openProvider}
                className="w-full md:w-[200px] justify-between bg-background border-border font-normal"
              >
                {provider
                  ? providerOptions.find((p) => p.value === provider)?.label
                  : "All Lenders"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search lender..." />
                <CommandList>
                  <CommandEmpty>No lender found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        onProviderChange("")
                        setOpenProvider(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          provider === "" ? "opacity-100" : "opacity-0"
                        )}
                      />
                      All Lenders
                    </CommandItem>
                    {providerOptions.map((opt) => (
                      <CommandItem
                        key={opt.value}
                        value={opt.value}
                        onSelect={(currentValue) => {
                          onProviderChange(currentValue === provider ? "" : currentValue)
                          setOpenProvider(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            provider === opt.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {opt.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}

        {/* Date Range Picker */}
        <div className="grid gap-2 w-full md:w-[260px]">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal bg-background border-border",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Select Dates</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={onDateRangeChange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Export Action */}
      {onExport && (
        <div className="w-full md:w-auto flex justify-end">
          <Button
            onClick={onExport}
            disabled={isExporting}
            className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-md transition-all hover:shadow-lg"
          >
            {isExporting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export Excel
          </Button>
        </div>
      )}
    </div>
  )
}

