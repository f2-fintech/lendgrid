"use client"
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AggregatorNotificationPage() {
  const notifications = [
    { id: 1, message: "New application submitted 📝", time: "15 min ago" },
    { id: 2, message: "Commission updated 💰", time: "1 hr ago" },
  ]

  return (
    <div className="min-h-screen bg-gray-900 flex justify-center items-start p-6">
      <Card className="bg-gray-800 border border-gray-700 shadow-lg w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-white text-2xl">Aggregator Notifications</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto">
          {notifications.map((n) => (
            <div key={n.id} className="p-3 bg-gray-700 rounded-lg flex justify-between">
              <span className="text-gray-200">{n.message}</span>
              <span className="text-xs text-gray-400">{n.time}</span>
            </div>
          ))}
        </CardContent>
        <div className="flex justify-center mb-4">
          <Link href="/aggregator/dashboard">
            <div className="min-h-screen bg-gray-900 flex flex-col p-6">
              <div className="flex justify-start w-full">
                <BackButton />
              </div>
            </div>  
          </Link>
        </div>
      </Card>
    </div>
  )
}
