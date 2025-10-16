"use client"

import { Button } from "./button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu"
import { Download } from "lucide-react"

export type ExportFormat = "pdf" | "xlsx"

export function ExportButton({
    onExport,
    disabled,
    label = "Export Report",
}: {
    onExport: (format: ExportFormat) => Promise<void> | void
    disabled?: boolean
    label?: string
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button disabled={disabled} className="bg-gradient-to-r from-blue to-cyan-500 text-dark" >
                    <Download className="w-4 h-4 mr-2" />
                    {label}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 text-white">
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-700" onClick={() => onExport("pdf")}>
                    Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-700" onClick={() => onExport("xlsx")}>
                    Export as Excel
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
