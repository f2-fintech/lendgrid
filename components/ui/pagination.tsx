"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"

export type TablePaginationProps = {
  page?: number
  currentPage?: number
  pageSize?: number
  total?: number
  totalItems?: number
  pageSizeOptions?: number[]
  onPageChange: (page: number) => void | Promise<void>
  onPageSizeChange?: (size: number) => void | Promise<void>
  className?: string
}

export function TablePagination({
  page: propPage,
  currentPage,
  pageSize = 10,
  total: propTotal,
  totalItems,
  pageSizeOptions = [5, 10, 20],
  onPageChange,
  onPageSizeChange,
  className,
}: TablePaginationProps) {
  const page = Math.max(1, Number(propPage ?? currentPage ?? 1) || 1)
  const total = Math.max(0, Number(propTotal ?? totalItems ?? 0) || 0)
  const safePageSize = Math.max(1, Number(pageSize) || 10)
  const totalPages = Math.max(1, Math.ceil(total / safePageSize))
  const start = total === 0 ? 0 : (page - 1) * safePageSize + 1
  const end = Math.min(total, page * safePageSize)

  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border pt-4 ${className || ""}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Rows per page</span>
        <Select
          value={String(pageSize)}
          onValueChange={async (val) => {
            const size = Number(val)
            await onPageSizeChange?.(size)
            // Default behavior if consumer didn't update page
            await onPageChange(1)
          }}
        >
          <SelectTrigger className="w-[84px] bg-background border-border text-foreground">
            <SelectValue placeholder={pageSize} />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border text-popover-foreground">
            {pageSizeOptions.map((opt) => (
              <SelectItem key={opt} value={String(opt)}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground tabular-nums">
          {start}–{end} of {total}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="border-border text-foreground hover:text-foreground hover:bg-muted bg-transparent"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="border-border text-foreground hover:text-foreground hover:bg-muted bg-transparent"
            disabled={page >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
