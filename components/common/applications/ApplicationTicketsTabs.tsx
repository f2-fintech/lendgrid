'use client'

import { FileText, ClipboardList } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Props {
    activeTab: 'applications' | 'tickets'
    onChange: (tab: 'applications' | 'tickets') => void
}

export function ApplicationTicketsTabs({ activeTab, onChange }: Props) {
    return (
        <Tabs
            value={activeTab}
            onValueChange={(v) => onChange(v as 'applications' | 'tickets')}
            className="w-full"
        >
            <TabsList className="grid w-full grid-cols-2 bg-gray-900/50 border-b border-gray-800">
                <TabsTrigger
                    value="applications"
                    className="text-base font-medium data-[state=active]:bg-gradient-to-r from-blue to-cyan-500"
                >
                    <FileText className="w-5 h-5 mr-2" />
                    Applications
                </TabsTrigger>

                <TabsTrigger
                    value="tickets"
                    className="text-base font-medium data-[state=active]:bg-gradient-to-r from-blue to-cyan-500"
                >
                    <ClipboardList className="w-5 h-5 mr-2" />
                    Tickets
                </TabsTrigger>
            </TabsList>
        </Tabs>
    )
}
