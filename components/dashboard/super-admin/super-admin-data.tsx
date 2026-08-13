"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileText, Database, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getCookie } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/graphql', '');

export function SuperAdminData() {
  const [activeTab, setActiveTab] = useState("dsa");
  const [dsaFile, setDsaFile] = useState<File | null>(null);
  const [payoutFile, setPayoutFile] = useState<File | null>(null);
  const [dsaData, setDsaData] = useState<any[]>([]);
  const [payoutData, setPayoutData] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUploads = async () => {
    setIsLoading(true);
    try {
      const token = getCookie("employee_token");
      
      const [dsaRes, payoutRes] = await Promise.all([
        fetch(`${API_BASE_URL}/commissions/uploads/dsa-billing`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/commissions/uploads/summary`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (dsaRes.ok) {
        setDsaData(await dsaRes.json());
      }
      if (payoutRes.ok) {
        setPayoutData(await payoutRes.json());
      }
    } catch (error) {
      console.error("Failed to fetch uploads:", error);
      toast.error("Failed to load uploaded data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  const handleUpload = async (type: "dsa" | "summary") => {
    const file = type === "dsa" ? dsaFile : payoutFile;
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = getCookie("employee_token");
      const endpoint = type === "dsa" ? "upload/dsa-billing" : "upload/summary";
      
      const res = await fetch(`${API_BASE_URL}/commissions/${endpoint}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success(data.message || "File uploaded successfully");
        if (type === "dsa") setDsaFile(null);
        else setPayoutFile(null);
        
        // Refresh data
        fetchUploads();
      } else {
        toast.error(data.message || "Failed to upload file");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("An error occurred during upload");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-full overflow-hidden">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
          <Database className="w-8 h-8 text-primary" /> Data Uploads
        </h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Upload modified Excel files to synchronize data with the platform
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="dsa">DSA Billing Data</TabsTrigger>
          <TabsTrigger value="summary">Payout Summary Data</TabsTrigger>
        </TabsList>

        <TabsContent value="dsa" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload DSA Billing Excel</CardTitle>
              <CardDescription>
                Upload the modified DSA Billing export file to track advances and manager details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Input 
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  onChange={(e) => setDsaFile(e.target.files?.[0] || null)}
                  className="max-w-md"
                />
                <Button 
                  onClick={() => handleUpload("dsa")} 
                  disabled={!dsaFile || isUploading}
                >
                  {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  Upload
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>DSA Billing Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loan No</TableHead>
                      <TableHead>DSA Name</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Comm. Rate</TableHead>
                      <TableHead>Total Bill</TableHead>
                      <TableHead>Net Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : dsaData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No DSA billing data uploaded yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      dsaData.map((row) => (
                        <TableRow key={row._id}>
                          <TableCell className="font-medium">{row.loanNo}</TableCell>
                          <TableCell>{row.dsaName}</TableCell>
                          <TableCell>{row.customerName}</TableCell>
                          <TableCell>₹{row.amountDisbursed?.toLocaleString()}</TableCell>
                          <TableCell>{row.commissionRate}</TableCell>
                          <TableCell>₹{row.totalBill?.toLocaleString()}</TableCell>
                          <TableCell className="font-bold">₹{row.netAmount?.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-500/10 text-green-500">Synced</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Payout Summary Excel</CardTitle>
              <CardDescription>
                Upload the modified Payout Summary export file to track advances, TDS, and remarks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Input 
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  onChange={(e) => setPayoutFile(e.target.files?.[0] || null)}
                  className="max-w-md"
                />
                <Button 
                  onClick={() => handleUpload("summary")} 
                  disabled={!payoutFile || isUploading}
                >
                  {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  Upload
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payout Summary Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loan No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Manager's Name</TableHead>
                      <TableHead>Total Business</TableHead>
                      <TableHead>Advance Amount</TableHead>
                      <TableHead>Net Pay</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : payoutData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No payout summary data uploaded yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      payoutData.map((row) => (
                        <TableRow key={row._id}>
                          <TableCell className="font-medium">{row.loanNo}</TableCell>
                          <TableCell>{row.name}</TableCell>
                          <TableCell>{row.managerName || "-"}</TableCell>
                          <TableCell>₹{row.totalBusiness?.toLocaleString()}</TableCell>
                          <TableCell className="text-amber-500">₹{row.advanceAmount?.toLocaleString() || 0}</TableCell>
                          <TableCell className="font-bold text-primary">₹{row.netAmountToPay?.toLocaleString()}</TableCell>
                          <TableCell>{row.remarks || "-"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
