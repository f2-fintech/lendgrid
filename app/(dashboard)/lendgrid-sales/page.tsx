"use client";

import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { AggregatorMemberApplications } from "@/components/dashboard/aggregator-member/AggregatorMemberApplications";
import { Calendar, Clock, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function LendgridSalesPage() {
  const { loading, role, user } = useAuth("lendgrid_sales");
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("");

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  const greeting = useMemo(() => {
    const hour = (currentDate || new Date()).getHours();
    if (hour < 12) return "Good Morning!";
    if (hour < 17) return "Good Afternoon!";
    return "Good Evening!";
  }, [currentDate]);

  const userName = useMemo(() => {
    const raw = user?.username || user?.name || user?.email?.split('@')[0] || "User";
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [user]);

  const formattedDateStr = useMemo(() => {
    if (!currentDate) return "";
    return format(currentDate, "EEEE, MMMM d, yyyy");
  }, [currentDate]);

  const months = useMemo(() => [
    { value: "all", label: "Month" },
    { value: "January", label: "January" },
    { value: "February", label: "February" },
    { value: "March", label: "March" },
    { value: "April", label: "April" },
    { value: "May", label: "May" },
    { value: "June", label: "June" },
    { value: "July", label: "July" },
    { value: "August", label: "August" },
    { value: "September", label: "September" },
    { value: "October", label: "October" },
    { value: "November", label: "November" },
    { value: "December", label: "December" },
  ], []);

  const { startDate, endDate } = useMemo(() => {
    if (selectedDate) {
      return { startDate: selectedDate, endDate: selectedDate };
    }
    if (selectedMonth && selectedMonth !== "all") {
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const monthIndex = monthNames.indexOf(selectedMonth);
      if (monthIndex !== -1) {
        const year = (currentDate || new Date()).getFullYear();
        const pad = (n: number) => String(n).padStart(2, "0");
        const firstDay = `${year}-${pad(monthIndex + 1)}-01`;
        const lastDate = new Date(year, monthIndex + 1, 0);
        const lastDay = `${year}-${pad(monthIndex + 1)}-${pad(lastDate.getDate())}`;
        return { startDate: firstDay, endDate: lastDay };
      }
    }
    return { startDate: null, endDate: null };
  }, [selectedMonth, selectedDate, currentDate]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || role !== "lendgrid_sales") {
    return null; // Will redirect via useAuth
  }

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      {/* Header Banner with Greeting & Temporal Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>{greeting}</span>
            <span className="text-primary">{userName}</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-primary/70" />
            <span>{formattedDateStr}</span>
          </p>
        </div>

        {/* Date / Month Filters */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <Select
            value={selectedMonth}
            onValueChange={(val) => {
              setSelectedMonth(val);
              if (val !== "all") setSelectedDate("");
            }}
          >
            <SelectTrigger className="w-32 h-9 bg-card/80 border-border text-xs font-medium rounded-lg">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value} className="text-xs">
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedDate(val);
                if (val) setSelectedMonth("all");
              }}
              className="h-9 w-36 bg-card/80 border-border text-xs font-medium rounded-lg pr-2 [color-scheme:dark]"
            />
          </div>
        </div>
      </div>

      <AggregatorMemberApplications startDate={startDate} endDate={endDate} />
    </div>
  );
}
