"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Topleftmenu } from "@/components/top-left-menu";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Customer {
  name: string;
  email: string;
  phone: string;
  orderCount: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  useEffect(() => {
    async function fetchCustomers() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/customers?page=${page}&limit=${limit}`);
        if (!res.ok) throw new Error("Failed to fetch customers");
        const data = await res.json();
        setCustomers(data.customers || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchCustomers();
  }, [page]);

  const handleCopy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied: ${value}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-6">
      <div className="w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Topleftmenu />
            <h1 className="text-xl md:text-3xl font-bold text-gray-900">Customers</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Customer List</CardTitle>
            <div className="text-sm text-gray-500 mt-1">Total Unique Customers: {totalCount}</div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64 text-red-500">{error}</div>
            ) : customers.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-gray-500">No customers found.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Order Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer, idx) => (
                      <TableRow key={customer.email + idx}>
                        <TableCell
                          className="cursor-pointer hover:bg-blue-50 transition-colors"
                          onClick={() => handleCopy(customer.name, 'Name')}
                        >
                          {customer.name}
                        </TableCell>
                        <TableCell
                          className="cursor-pointer hover:bg-blue-50 transition-colors"
                          onClick={() => handleCopy(customer.email, 'Email')}
                        >
                          {customer.email}
                        </TableCell>
                        <TableCell
                          className="cursor-pointer hover:bg-blue-50 transition-colors"
                          onClick={() => handleCopy(customer.phone, 'Phone')}
                        >
                          {customer.phone}
                        </TableCell>
                        <TableCell
                          className="cursor-pointer hover:bg-blue-50 transition-colors"
                          onClick={() => handleCopy(String(customer.orderCount), 'Order Count')}
                        >
                          {customer.orderCount}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {/* Pagination */}
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 