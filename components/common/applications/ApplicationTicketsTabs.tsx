'use client'

import { FileText, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
    activeTab: 'applications' | 'tickets'
    onChange: (tab: 'applications' | 'tickets') => void
}

export function ApplicationTicketsTabs({ activeTab, onChange }: Props) {
    return (
        <div className="flex items-center gap-1.5 p-1 bg-card/80 border border-border/80 rounded-xl w-fit shadow-sm backdrop-blur-sm">
            <button
                type="button"
                onClick={() => onChange('applications')}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 select-none cursor-pointer",
                    activeTab === 'applications'
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
            >
                <FileText className="w-4 h-4" />
                <span>Fresh Applications</span>
            </button>

            <button
                type="button"
                onClick={() => onChange('tickets')}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 select-none cursor-pointer",
                    activeTab === 'tickets'
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
            >
                <ClipboardList className="w-4 h-4" />
                <span>Tickets</span>
            </button>
        </div>
    )
}
