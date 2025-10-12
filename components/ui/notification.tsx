"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "./button"
import Link from "next/link"

export function NotificationBar() {
  // ✅ useState should destructure [state, setState]
  const [notification] = useState([
    { id: 1, message: "New user signed up", time: "2 min ago" },
    { id: 2, message: "Payment received", time: "10 min ago" },
    { id: 3, message: "System update completed", time: "1 hr ago" },
    { id: 4, message: "New order placed", time: "2 hr ago" },
    { id: 5, message: "Server maintenance scheduled", time: "Yesterday" },
  ])

  return (
    <div className="min-h-screen bg-black flex justify-center items-start p-6">
      <Card className="w-full max-w-3xl bg-white shadow-xl border border-gray-200 rounded-2xl">
        <CardContent className="p-6">
          {/* Page Heading */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-white">Notifications</h3>
            <Link href="/">
              <Button className="bg-gray-800 text-white hover:bg-gray-700 rounded-lg">
                ⬅ Back
              </Button>
            </Link>
          </div>

          {/* Notifications List */}
          <ul className="space-y-3 max-h-[70vh] overflow-y-auto ">
            {notification.map((n) => (
              <li
                key={n.id}
                className="flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition rounded-lg p-4 border border-gray-200 shadow-sm"
              >
                <span className="text-gray-800">{n.message}</span>
                <span className="text-xs text-gray-500">{n.time}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
