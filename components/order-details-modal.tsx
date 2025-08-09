"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DollarSign,
  Package,
  User,
  Calendar,
  MapPin,
  Copy,
  Printer,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Order, OrderItem, ProjectBundleItem } from "@/app/page";

interface OrderDetailsModalProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailsModal({
  order,
  open,
  onOpenChange,
}: OrderDetailsModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  if (!order) return null;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getItemsCount = () =>
    order.items.reduce((total, item) => total + item.quantity, 0);

  const getItemsTotal = () =>
    order.items.reduce((total, item) => {
      if ("product" in item) {
        return total + Number(item.product.price || 0) * item.quantity;
      } else {
        const bundleTotal =
          Array.isArray(item.products)
            ? item.products.reduce((sum, p) => sum + Number(p.price || 0), 0)
            : 0;
        return total + item.quantity * bundleTotal;
      }
    }, 0);

  const getTotalAveCost = () =>
    order.items.reduce((total, item) => {
      if ("product" in item) {
        return total + Number(item.product.ave_cost || 0) * item.quantity;
      } else {
        const bundleCost =
          Array.isArray(item.products)
            ? item.products.reduce((sum, p) => sum + Number(p.ave_cost || 0), 0)
            : 0;
        return total + item.quantity * bundleCost;
      }
    }, 0);

  const getCalculatedTotal = () => getItemsTotal() - (order.discount || 0);

  const totalSales = getItemsTotal();
  const totalAveCost = getTotalAveCost();
  const netProfit = totalSales - totalAveCost;

  const handleMarkAsCompleted = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order._id, status: "completed" }),
      });

      if (!res.ok) throw new Error("Failed to update order status");
      toast.success("Order marked as completed!");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to update order status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order._id, status: "canceled" }),
      });

      if (!res.ok) throw new Error("Failed to cancel order");
      toast.success("Order has been canceled!");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to cancel order");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:!max-h-none print:!overflow-visible print:!shadow-none print:!bg-white">
  <div className="print-area space-y-6">
          {/* Header */}
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Details
            </DialogTitle>
            <DialogDescription
              onClick={() => {
                navigator.clipboard.writeText(order._id);
                toast.success("Order ID copied to clipboard");
              }}
              className="cursor-pointer flex gap-2 items-center"
            >
              Order ID: {order._id}
              <Copy size={14} className="text-[#00BED5]" />
            </DialogDescription>
          </DialogHeader>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-4 w-4" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <Badge
                  variant="secondary"
                  className={
                    order.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : order.status === "canceled"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }
                >
                  {order.status}
                </Badge>
              </div>

              {order.status === "pending" && (
                <div className="space-y-2">
                  <Button
                    onClick={handleMarkAsCompleted}
                    disabled={isLoading}
                    className="w-full print:hidden"
                  >
                    {isLoading ? "Marking as Completed..." : "Mark as Completed"}
                  </Button>
                  <Button
                    onClick={handleCancelOrder}
                    disabled={isLoading}
                    variant="destructive"
                    className="w-full print:hidden"
                  >
                    {isLoading ? "Canceling Order..." : "Cancel Order"}
                  </Button>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span>Total Items</span>
                <span className="font-medium">{getItemsCount()}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-medium">
                  KD {getItemsTotal().toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Shipping Fee</span>
                <span className="font-medium">
                  KD {(order.shippingFee || 0).toFixed(2)}
                </span>
              </div>

              {order.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Discount</span>
                  <span className="font-medium text-green-700">
                    -KD {order.discount.toFixed(2)}
                  </span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-[#00BED5]">
                  KD {getCalculatedTotal().toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-sm text-green-700 font-bold">
                <span>Net Profit</span>
                <span>KD {netProfit.toFixed(2)}</span>
              </div>

              <div className="text-xs text-muted-foreground text-right">
                (Sales - Ave. Cost) <br />
                KD {totalSales.toFixed(2)} - KD {totalAveCost.toFixed(2)}
              </div>

              <div className="flex justify-between text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Order Date
                </span>
                <span>{formatDate(order.createdAt)}</span>
              </div>

              {/* Print Button */}
              <Button
                onClick={handlePrint}
                variant="outline"
                className="w-full print:hidden"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Order
              </Button>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-4 w-4" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <strong>Name:</strong> {order.customerInfo.name}
              </p>
              <p>
                <strong>Email:</strong> {order.customerInfo.email}
              </p>
              <p>
                <strong>Phone:</strong> {order.customerInfo.phone}
              </p>
              <Separator />
              <p className="flex gap-1 items-center text-gray-700">
                <MapPin className="h-3 w-3" />
                {order.customerInfo.house}, {order.customerInfo.street},{" "}
                {order.customerInfo.area}, {order.customerInfo.block},{" "}
                {order.customerInfo.city}, {order.customerInfo.country}
              </p>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-4 w-4" />
                Order Items ({getItemsCount()} items)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item, index) => {
                const isProject = "products" in item;
                const img = isProject
                  ? item.products?.[0]?.image?.split(",")[0] ??
                    "/amtronics-logo.webp"
                  : item.product?.image?.split(",")[0] ?? "/amtronics-logo.webp";
                const title = isProject
                  ? item.projectName
                  : item.product?.en_name ?? "Unnamed product";
                const price = isProject
                  ? (Array.isArray(item.products)
                      ? item.products.reduce(
                          (sum, p) => sum + Number(p.price || 0),
                          0
                        )
                      : 0)
                  : Number(item.product?.price || 0);

                return (
                  <div
                    key={index}
                    className="flex items-start gap-4 border p-3 rounded-lg flex-col md:flex-row"
                  >
                    <img
                      src={img}
                      alt={title}
                      className="w-16 h-16 object-cover border rounded-md"
                      onError={(e) =>
                        (e.currentTarget.src = "/amtronics-logo.webp")
                      }
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{title}</p>
                      {isProject && (
                        <p className="text-xs text-gray-500">
                          Engineers: {item.engineerNames?.join(", ") || "N/A"}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Qty: {item.quantity}
                      </p>
                      <p className="text-xs">
                        KD {(price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}