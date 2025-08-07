"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Eye,  Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import * as XLSX from "xlsx";
import dynamic from "next/dynamic";
const Topleftmenu = dynamic(() => import('@/components/top-left-menu'))

interface Customer {
  name: string;
  email: string;
  phone: string;
  city?: string;
  area?: string;
  orderCount: number;
}

interface Order {
  _id: string;
  total: number;
  status: string;
  createdAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;
  const [showUnique, setShowUnique] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEmail, setModalEmail] = useState<string | null>(null);
  const [modalOrders, setModalOrders] = useState<Order[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

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

  // Helper to filter unique customers by email and sum order counts
  const uniqueCustomers = showUnique
    ? Array.from(
        customers.reduce((map, c) => {
          if (map.has(c.email)) {
            map.get(c.email).orderCount += c.orderCount;
          } else {
            map.set(c.email, { ...c });
          }
          return map;
        }, new Map())
      .values())
    : customers;

  const handleViewOrders = (email: string) => {
    setModalEmail(email);
    setModalOpen(true);
    setModalOrders([]);
    setModalLoading(true);
    setModalError(null);
    fetch(`/api/customers/orders?email=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data) => {
        setModalOrders(data.orders || []);
        setModalLoading(false);
      })
      .catch((err) => {
        setModalError("Failed to fetch orders");
        setModalLoading(false);
      });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-6">
      <div className="w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Topleftmenu />
            <h1 className="text-xl md:text-3xl font-bold text-gray-900">Customers</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const dataToExport = uniqueCustomers.map((c) => ({
                  Name: c.name,
                  Email: c.email,
                  Phone: c.phone,
                  City: c.city || "",
                  Area: c.area || "",
                  "Order Count": c.orderCount,
                }));
                const worksheet = XLSX.utils.json_to_sheet(dataToExport);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
                XLSX.writeFile(workbook, "customers.xlsx");
              }}
              className="ml-2"
              disabled={loading}
            >
              <Download/>
              Export
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Total Unique Customers: {showUnique ? uniqueCustomers.length : totalCount}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Switch checked={showUnique} onCheckedChange={setShowUnique} id="unique-toggle" />
              <label htmlFor="unique-toggle" className="text-xs md:text-sm text-gray-600 cursor-pointer">Show only unique customers (by email)</label>
            </div>
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
                      <TableHead>City</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead>Order Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uniqueCustomers.map((customer, idx) => (
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
                        <TableCell>{customer.city || "-"}</TableCell>
                        <TableCell>{customer.area || "-"}</TableCell>
                        <TableCell
                          className="cursor-pointer hover:bg-blue-50 transition-colors flex items-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewOrders(customer.email);
                          }}
                        >
                          {customer.orderCount}
                          <button
                            type="button"
                            className="ml-2 text-gray-500 hover:text-blue-600"
                            aria-label="View Orders"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
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

        {/* Orders Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Orders for {modalEmail}</DialogTitle>
            </DialogHeader>
            {modalLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : modalError ? (
              <div className="text-red-500 text-center">{modalError}</div>
            ) : modalOrders.length === 0 ? (
              <div className="text-gray-500 text-center">No orders found for this customer.</div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modalOrders.map((order) => (
                      <TableRow key={order._id}>
                        <TableCell 
                        className="cursor-pointer hover:bg-blue-50 transition-colors"
                        onClick={() => handleCopy(order._id, 'Order ID')}
                        >{order._id}</TableCell>
                        <TableCell>{order.total}</TableCell>
                        <TableCell>{order.status}</TableCell>
                        <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 