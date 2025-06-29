"use client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Package, User, MapPin, Calendar, DollarSign, Tag, Copy } from "lucide-react"
import type { Order } from "@/app/page"
import { toast } from "sonner"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface OrderDetailsModalProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OrderDetailsModal({ order, open, onOpenChange }: OrderDetailsModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  if (!order) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getItemsCount = () => {
    return order.items.reduce((total, item) => total + item.quantity, 0)
  }

  const getItemsTotal = () => {
    return order.items.reduce((total, item) => total + item.product.price * item.quantity, 0)
  }

  const getCalculatedTotal = () => {
    const subtotal = getItemsTotal();
    return subtotal - (order.discount || 0);
  }



  const handleMarkAsCompleted = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: order._id, status: "completed" }),
      })

      if (response.ok) {
        toast.success("Order marked as completed!")
        onOpenChange(false) // Close the modal on success
        router.refresh()
      } else {
        const data = await response.json()
        toast.error(data.message || "Failed to update order status.")
      }
    } catch (error) {
      console.error("Error updating order status:", error)
      toast.error("An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Details
          </DialogTitle>
          <DialogDescription
          onClick={() => {
            navigator.clipboard.writeText(order._id)
            toast.success("Promo Code copied to clipboard")
          }}
          className="cursor-pointer flex gap-2 items-center"
          >Order ID: {order._id} 
          <Copy size='14' className="text-[#00BED5]" />
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1  gap-2 ">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-4 w-4" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status</span>
                <Badge variant="secondary"  className={
      order.status === "completed"
        ? "bg-green-100 text-green-800"
        : "bg-yellow-100 text-yellow-800"
    }>
                  {order.status}
                </Badge>
              </div>
              {order.status === "pending" && (
                <Button onClick={handleMarkAsCompleted} disabled={isLoading} className="w-full">
                  {isLoading ? "Marking as Completed..." : "Mark as Completed"}
                </Button>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Items</span>
                <span className="font-medium">{getItemsCount()} items</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Subtotal</span>
                <p className="text-right"><span className="font-medium">KD{getItemsTotal().toFixed(2)}</span></p>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Shipping Fee</span>
                <p className="text-right"><span className="font-medium">KD{order.shippingFee?.toFixed(2) ?? '0.00'}</span></p>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Discount</span>
                  <p className="text-right"><span className="font-medium text-green-600">-KD{order.discount.toFixed(2)}</span></p>
                </div>
              )}
              {order.promoCode && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Promo Code</span>
                  <Badge variant="outline" className="text-xs cursor-pointer" onClick={() => {
                    navigator.clipboard.writeText(order.promoCode)
                    toast.success("Promo Code copied to clipboard")
                  }}>
                    <Tag className="h-3 w-3 mr-1" />  
                    {order.promoCode}
                  </Badge>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total</span>
                <span className="text-[#00BED5]">KD{getCalculatedTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Order Date
                </span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-4 w-4" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Name</label>
                <p className="text-sm">{order.customerInfo.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-sm">{order.customerInfo.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Phone</label>
                <p className="text-sm">{order.customerInfo.phone}</p>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Shipping Address
                </label>
                <div className="text-sm space-y-1 mt-1">
                  <p>
                    {order.customerInfo.house}, {order.customerInfo.street}
                  </p>
                  <p>
                    {order.customerInfo.area}, {order.customerInfo.block}
                  </p>
                  <p>
                    {order.customerInfo.city}, {order.customerInfo.country}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-4 w-4" />
              Order Items ({getItemsCount()} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
          <div className="space-y-4">
  {order.items.map((item, index) => (
    <div key={index} className="flex items-start gap-4 p-4 border rounded-lg flex-col md:flex-row">
      <div className="flex-shrink-0 relative">
        <img
          src={item.product.image?.split(",")[0] || "/placeholder.svg?height=80&width=80"}
          alt={item.product.en_name}
          className="w-16 h-16 object-cover rounded-md border"
          onError={(e) => {
            e.currentTarget.src = "/placeholder.svg?height=80&width=80";
          }}
        />
        <div className="absolute -top-2 -right-2 bg-[#00B8DB] text-white text-xs font-medium px-2 py-1 rounded-full">
          {item.quantity}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm line-clamp-2">{item.product.en_name}</h4>
        <div className="flex items-center gap-4 mt-2">
          {item.product.sku && (
            <span className="text-xs text-gray-500">SKU: {item.product.sku}</span>
          )}
          {item.product.barcode && (
            <span className="text-xs text-gray-500">Barcode: {item.product.barcode}</span>
          )}
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        <div className="text-xs font-medium">KD {item.product.price.toFixed(2)}</div>
        <div className="text-xs text-gray-500">Ave. Cost: KD {item.product.ave_cost?.toFixed(2) ?? '0.00'}</div>
        <div className="text-sm font-bold mt-1">KD {(item.product.price * item.quantity).toFixed(2)}</div>
      </div>
    </div>
  ))}
</div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
