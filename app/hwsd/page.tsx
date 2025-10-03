"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Pencil, Trash } from "lucide-react";
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

export default function HWSDPage() {
  const [fees, setFees] = useState<HWSDFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentFee, setCurrentFee] = useState<HWSDFee | null>(null);
  
  // Form states
  const [title, setTitle] = useState("");
  const [serviceType, setServiceType] = useState("hardware");
  const [price, setPrice] = useState("");
const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/hwsd");
      if (!response.ok) throw new Error("Failed to fetch fees");
      const data = await response.json();
      setFees(data.fees || []);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching data");
      toast.error("Failed to load fees data");
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-6">
      <div className="w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Topleftmenu />
            <h1 className="text-xl md:text-3xl font-bold text-gray-900">Hardware & Software Design</h1>
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
                          <th className="px-4 py-2 text-left">Notes</th> {/* <-- Add this */}
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
                  </tbody>
                </table>
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
                  <SelectItem value="both">Both</SelectItem>
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