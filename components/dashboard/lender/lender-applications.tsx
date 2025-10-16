"use client"

import { useEffect, useState } from 'react'
import { applicationsApi } from '@/lib/api-client'
import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function LenderApplications() {
  const { user } = useAuth('lender_admin')
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const lenderId = (user as any)?._id || (user as any)?.id
        const resp = await applicationsApi.list({ page: 1, limit: 50, lenderId })
        const r = resp?.data?.results || []
        if (!mounted) return
        setRows(r)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    if (user) load()
    return () => { mounted = false }
  }, [user])

  return (
    <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-gray-300">Customer</TableHead>
                <TableHead className="text-gray-300">Loan Type</TableHead>
                <TableHead className="text-gray-300">Amount</TableHead>
                <TableHead className="text-gray-300">Aggregator</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a._id}>
                  <TableCell className="text-white">{a.customerName}</TableCell>
                  <TableCell className="text-gray-300">{a.loanType}</TableCell>
                  <TableCell className="text-gray-300">₹{a.loanAmount?.toLocaleString?.() || a.loanAmount}</TableCell>
                  <TableCell className="text-gray-300">{a.aggregatorName || a.aggregatorId}</TableCell>
                  <TableCell className="text-gray-300">{a.status}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Select
                      value={a.status}
                      onValueChange={async (v) => {
                        try {
                          setUpdatingId(a._id)
                          await applicationsApi.updateStatus(a._id, { status: v })
                          setRows((prev) => prev.map((r) => (r._id === a._id ? { ...r, status: v } : r)))
                        } finally {
                          setUpdatingId(null)
                        }
                      }}
                    >
                      <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-gray-200">
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="disbursed">Disbursed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length && !loading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-400">No applications found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
  )
}


