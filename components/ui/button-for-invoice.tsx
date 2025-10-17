"use client"

import { Button } from "./button"
import { FileText } from "lucide-react"

export function InvoiceButton({
    onGenerate,
    disabled,
    label = "Generate Invoice",
}: {
    onGenerate: () => Promise<void> | void
    disabled?: boolean
    label?: string
}) {
    return (
        <Button onClick={() => onGenerate()} disabled={disabled} variant="outline" className="border-gray-600 bg-gradient-to-r from-blue to-cyan-500 text-black">
            <FileText className="w-4 h-4 mr-2 bg-gradient-to-r from-blue to-cyan-500" />
            {label}
        </Button>
    )
}
