"use client"

import { useState, useMemo } from "react"
import { Search, Loader2, UserCheck, CheckCircle2, User, Building, Hash } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useF2FintechEmployeesInfinite } from "@/hooks/use-f2fintech-employees"
import { useGenerateOmsReferral } from "@/hooks/use-oms-referrals"

interface GenerateOmsReferralDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingOmsEmployeeIds?: string[]
}

function getInitials(name?: string) {
  if (!name || !name.trim()) return "OMS"
  return name
    .trim()
    .split(/\s+/)
    .map((s) => s.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("")
}

export function GenerateOmsReferralDialog({
  open,
  onOpenChange,
  existingOmsEmployeeIds = [],
}: GenerateOmsReferralDialogProps) {
  const [search, setSearch] = useState("")
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)

  const { data, isLoading } = useF2FintechEmployeesInfinite({
    limit: 100,
    search: search.trim() || undefined,
    enabled: open,
  })

  const generateMutation = useGenerateOmsReferral()

  // Flatten employees and filter out any invalid records
  const allEmployees = useMemo(() => {
    return data?.pages.flatMap((page) => page.employees) ?? []
  }, [data])

  const selectedEmployee = useMemo(() => {
    return (
      allEmployees.find(
        (e) => (e._id || e.employeeId) === selectedEmployeeId,
      ) ?? null
    )
  }, [allEmployees, selectedEmployeeId])

  const handleGenerate = async () => {
    if (!selectedEmployeeId || !selectedEmployee) return
    try {
      await generateMutation.mutateAsync({
        employeeId: selectedEmployee._id || selectedEmployee.employeeId,
        employeeName:
          selectedEmployee.name ||
          `${selectedEmployee.first_name || ''} ${selectedEmployee.last_name || ''}`.trim() ||
          selectedEmployee.email,
        employeeCode: selectedEmployee.code || selectedEmployee.employeeId,
        designation: selectedEmployee.role || selectedEmployee.department,
      })
      setSelectedEmployeeId(null)
      setSearch("")
      onOpenChange(false)
    } catch {
      // Error handled by mutation toast
    }
  }

  const handleClose = () => {
    setSelectedEmployeeId(null)
    setSearch("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <UserCheck className="w-5 h-5 text-primary" />
            Generate OMS Referral Code
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Select an employee from the F2Fintech directory to generate their unique <code className="text-primary font-mono font-semibold">OMS-XXXXXX</code> referral code.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search employee by name, code or designation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background border-border text-foreground"
            />
          </div>

          {/* Employee Directory List */}
          <div className="border border-border rounded-lg overflow-hidden bg-background/50">
            <div className="p-2.5 bg-muted/40 border-b border-border flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Select Employee</span>
              <span>{allEmployees.length} Available</span>
            </div>

            <ScrollArea className="h-64 p-2">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground text-sm">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span>Loading employees...</span>
                </div>
              ) : allEmployees.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm">
                  <p>No employees match your search.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {allEmployees.map((emp) => {
                    const empKey = emp._id || emp.employeeId
                    const fullName =
                      emp.name ||
                      `${emp.first_name || ""} ${emp.last_name || ""}`.trim() ||
                      emp.email
                    const isSelected = selectedEmployeeId === empKey
                    const alreadyHasCode =
                      existingOmsEmployeeIds.includes(empKey) ||
                      (emp._id && existingOmsEmployeeIds.includes(emp._id)) ||
                      (emp.employeeId && existingOmsEmployeeIds.includes(emp.employeeId))

                    return (
                      <div
                        key={empKey}
                        onClick={() => setSelectedEmployeeId(empKey)}
                        className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-primary/10 border-primary text-foreground shadow-sm"
                            : "bg-card/50 border-border/70 hover:bg-muted/40 hover:border-border text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="w-8 h-8 rounded-lg flex-shrink-0">
                            <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                              {getInitials(fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold truncate text-foreground">{fullName}</p>
                              {emp.code && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border text-muted-foreground">
                                  {emp.code}
                                </Badge>
                              )}
                              {alreadyHasCode && (
                                <Badge className="text-[10px] px-1.5 py-0 bg-blue-500/15 text-blue-400 border-blue-500/30">
                                  Has Code
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {emp.role || emp.department || emp.email}
                            </p>
                          </div>
                        </div>

                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Selected Employee Preview */}
          {selectedEmployee && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Avatar className="w-9 h-9 rounded-lg">
                  <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
                    {getInitials(
                      selectedEmployee.name ||
                        `${selectedEmployee.first_name || ""} ${selectedEmployee.last_name || ""}`.trim() ||
                        "OMS",
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {selectedEmployee.name ||
                      `${selectedEmployee.first_name || ""} ${selectedEmployee.last_name || ""}`.trim() ||
                      selectedEmployee.email}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>{selectedEmployee.role || selectedEmployee.department || "Staff"}</span>
                    {(selectedEmployee.code || selectedEmployee.employeeId) && (
                      <span>• Code: {selectedEmployee.code || selectedEmployee.employeeId}</span>
                    )}
                  </p>
                </div>
              </div>
              <Badge className="bg-primary/20 text-primary border-primary/30">Selected</Badge>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={generateMutation.isPending}
              className="border-border text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={!selectedEmployeeId || generateMutation.isPending}
              className="gap-2"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  Generate Referral Code
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
