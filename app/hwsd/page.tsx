"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Pencil, Trash, ChevronLeft, ChevronRight, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Topleftmenu = dynamic(() => import('@/components/top-left-menu'));

interface HWSDFee {
  _id: string;
  title: string;
  serviceType: string;
  price: number;
  createdAt: string;
  notes?: string;
}

const dateOptions = [
  { label: "Last 30 Days", value: "30days" },
  { label: "Last 3 Months", value: "3months" },
  { label: "Last 6 Months", value: "6months" },
  { label: "Last 1 Year", value: "1year" },
  { label: "All Time", value: "all" },
];

export default function HWSDPage() {
  const [fees, setFees] = useState<HWSDFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentFee, setCurrentFee] = useState<HWSDFee | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Form states
  const [title, setTitle] = useState("");
  const [serviceType, setServiceType] = useState("hardware");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");

  // Date filter state
  const [dateFilter, setDateFilter] = useState("30days");

  // Export loading state
  const [exportLoading, setExportLoading] = useState<"pdf" | "excel" | null>(null);

  useEffect(() => {
    fetchFees();
  }, [currentPage, itemsPerPage, dateFilter]);

  const fetchFees = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/hwsd?page=${currentPage}&limit=${itemsPerPage}&dateFilter=${dateFilter}`);
      if (!response.ok) throw new Error("Failed to fetch fees");
      const data = await response.json();
      setFees(data.fees || []);
      setTotalItems(data.total || data.fees.length);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching data");
      toast.error("Failed to load fees data");
    } finally {
      setLoading(false);
    }
  };

const fetchAllFeesForExport = async () => {
  const response = await fetch(`/api/hwsd?limit=100000&dateFilter=${dateFilter}`);
  if (!response.ok) throw new Error("Failed to fetch all fees");
  const data = await response.json();
  return data.fees || [];
};

  // Export PDF
  const handleExportPDF = async () => {
    // if (!window.confirm("Export all filtered fees to PDF? This may take a while.")) return;
    setExportLoading("pdf");
    try {
      const allFees = await fetchAllFeesForExport();
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF();
      const dataToExport = allFees.map((fee: HWSDFee) => [
        fee.title,
        fee.serviceType,
        fee.price,
        fee.notes || "",
        new Date(fee.createdAt).toLocaleDateString(),
      ]);
      autoTable(doc, {
        head: [["Title", "Service Type", "Price (KD)", "Notes", "Created"]],
        body: dataToExport,
      });
      doc.save("hwsd-fees.pdf");
      toast.success("PDF exported successfully!");
    } catch (err: any) {
      toast.error("Failed to export PDF: " + (err.message || err));
    } finally {
      setExportLoading(null);
    }
  };

  // Export Excel
  const handleExportExcel = async () => {
    // if (!window.confirm("Export all filtered fees to Excel? This may take a while.")) return;
    setExportLoading("excel");
    try {
      const allFees = await fetchAllFeesForExport();
      const XLSX = await import("xlsx");
      const dataToExport = allFees.map((fee: HWSDFee) => ({
        Title: fee.title,
        "Service Type": fee.serviceType,
        "Price (KD)": fee.price,
        Notes: fee.notes || "",
        Created: new Date(fee.createdAt).toLocaleDateString(),
      }));
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Fees");
      XLSX.writeFile(workbook, "hwsd-fees.xlsx");
      toast.success("Excel exported successfully!");
    } catch (err: any) {
      toast.error("Failed to export Excel: " + (err.message || err));
    } finally {
      setExportLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !price) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const payload = {
        title,
        serviceType,
        price,
        notes
      };

      const url = isEditing ? `/api/hwsd/${currentFee?._id}` : "/api/hwsd";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Operation failed");
      }

      toast.success(isEditing ? "Fee updated successfully" : "Fee added successfully");
      resetForm();
      setIsDialogOpen(false);
      fetchFees();
    } catch (err: any) {
      toast.error(err.message || "Failed to process request");
    }
  };

  const handleEdit = (fee: HWSDFee) => {
    setCurrentFee(fee);
    setTitle(fee.title);
    setServiceType(fee.serviceType);
    setPrice(fee.price.toString());
    setNotes(fee.notes || "");
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this fee?")) return;

    try {
      const response = await fetch(`/api/hwsd/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Delete operation failed");
      }

      toast.success("Fee deleted successfully");
      fetchFees();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete fee");
    }
  };

  const resetForm = () => {
    setTitle("");
    setServiceType("hardware");
    setPrice("");
    setNotes(""); 
    setCurrentFee(null);
    setIsEditing(false);
  };

  const handleOpenDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Calculate total price of all fees
  const totalPrice = fees.reduce((sum, fee) => sum + Number(fee.price), 0);
  
  // Calculate total pages
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Add this function after the existing handleExportPDF function
  const handleExportSinglePDF = async (fee: HWSDFee) => {
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF();

      // Add logos at the top
      // doc.addImage('/amtronics-logo.webp', 'WEBP', 14, 10, 28, 28, undefined, 'FAST', 0);
      doc.addImage('/amtronics-logo.jpg', 'JPEG', 14, 10, 28, 28);
      
      doc.addImage('/invoice-amtronics-logo-at-the-end.jpg', 'JPEG', 170, 10, 28, 28, undefined, 'FAST', 0);

      // Title and metadata
      doc.setFontSize(16);
      doc.text("Hardware & Software & 3D print", 14, 50);
      
      // Fee details table
      autoTable(doc, {
        startY: 60,
        head: [["Field", "Value"]],
        body: [
          ["Title", fee.title],
          ["Service Type", fee.serviceType],
          ["Price (KD)", fee.price.toFixed(3)],
          ["Created Date", new Date(fee.createdAt).toLocaleDateString()],
          ["Notes", fee.notes || "N/A"],
        ],
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        styles: { fontSize: 10, cellPadding: 4 },
        margin: { left: 14, right: 14 }
      });

      // Get the final Y position after the table
      const finalY = (doc as any).lastAutoTable?.finalY || 180;

      // Add signature boxes at the bottom
const pageHeight = doc.internal.pageSize.getHeight();
const pageWidth = doc.internal.pageSize.getWidth();
const boxWidth = 50; // Reduced from 80
const boxHeight = 20; // Reduced from 30
const margin = 20;
const yPos = pageHeight - boxHeight - margin;

// Company Signature (far left)
doc.setDrawColor(100);
doc.setLineWidth(0.5);
doc.rect(10, yPos, boxWidth, boxHeight); // Moved to x=10
doc.setFontSize(8); // Smaller font
doc.text("Signature and stamp", 10 + boxWidth / 2, yPos + boxHeight / 2, { align: "center" });

      // Customer Signature (right)
doc.rect(pageWidth - boxWidth - 10, yPos, boxWidth, boxHeight); // Positioned from right edge
doc.text("Customer Signature", pageWidth - boxWidth - 10 + boxWidth / 2, yPos + boxHeight / 2, { align: "center" });

      // Save the PDF
      doc.save(`hwsd-fee-${fee._id}.pdf`);
      toast.success("PDF exported successfully!");
    } catch (err: any) {
      toast.error("Failed to export PDF: " + (err.message || err));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-6">
      <div className="w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Topleftmenu />
            <h1 className="text-xl md:text-3xl font-bold text-gray-900">Hardware & Software Design & Print</h1>
            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="border rounded px-2 py-1 text-sm ml-2"
              disabled={loading}
            >
              {dateOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {/* Export Buttons */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              className="ml-2"
              disabled={exportLoading !== null}
            >
              {exportLoading === "pdf" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="ml-2"
              disabled={exportLoading !== null}
            >
              {exportLoading === "excel" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Export Excel
            </Button>
          </div>
          <Button onClick={handleOpenDialog} className="flex items-center gap-2">
            <Plus size={16} />
            New
          </Button>
        </div>

        {/* Main content */}
        <Card>
          <CardHeader>
            <CardTitle>Designs</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">{error}</div>
            ) : fees.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No fees found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 text-left">Title</th>
                      <th className="px-4 py-2 text-left">Service Type</th>
                      <th className="px-4 py-2 text-left">Price (KD)</th>
                      <th className="px-4 py-2 text-left">Notes</th>
                      <th className="px-4 py-2 text-left">Created</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.map((fee) => (
                      <tr key={fee._id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3">{fee.title}</td>
                        <td className="px-4 py-3 capitalize">{fee.serviceType}</td>
                        <td className="px-4 py-3">KD {Number(fee.price).toFixed(2)}</td>
                        <td className="px-4 py-3">{fee.notes || ""}</td>
                        <td className="px-4 py-3">{new Date(fee.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleExportSinglePDF(fee)}
                              className="h-8 w-8 p-0"
                              title="Export PDF"
                            >
                              <Download size={14} />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEdit(fee)}
                              className="h-8 w-8 p-0"
                            >
                              <Pencil size={14} />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:border-red-700"
                              onClick={() => handleDelete(fee._id)}
                            >
                              <Trash size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {/* Total Row */}
                    <tr className="border-t bg-gray-50 font-bold">
                      <td className="px-4 py-3">Total</td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3">KD {totalPrice.toFixed(2)}</td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3"></td>
                    </tr>
                  </tbody>
                </table>
                
                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline" 
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}</span> to{" "}
                        <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{" "}
                        <span className="font-medium">{totalItems}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="gap-2 isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <Button
                          variant="outline"
                          className="rounded-l-md"
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </Button>
                        
                        {/* Page numbers */}
                        {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                          // Logic to show pages around current page
                          let pageNumber;
                          if (totalPages <= 5) {
                            pageNumber = i + 1;
                          } else if (currentPage <= 3) {
                            pageNumber = i + 1;
                            if (i === 4) pageNumber = totalPages;
                          } else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + i;
                          } else {
                            pageNumber = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={i}
                              variant={currentPage === pageNumber ? "default" : "outline"}
                              className={`px-4 ${currentPage === pageNumber ? 'bg-blue-500 text-white' : ''}`}
                              onClick={() => handlePageChange(pageNumber)}
                            >
                              {pageNumber}
                            </Button>
                          );
                        })}
                        
                        <Button
                          variant="outline"
                          className="rounded-r-md"
                          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </Button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog for adding/editing fees */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Fee" : "Add New Fee"}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Update the details for this fee." 
                : "Enter the details for the new hardware or software fee."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Fee title"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="serviceType">Service Type</Label>
              <Select 
                value={serviceType} 
                onValueChange={setServiceType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hardware">Hardware</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                  
                  <SelectItem value="3d-print">3D Print</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="price">Price (KD)</Label>
              <Input 
                id="price" 
                type="number" 
                step="0.001"
                min="0"
                value={price} 
                onChange={(e) => setPrice(e.target.value)} 
                placeholder="0.00"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? "Update" : "Add"} Fee
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}