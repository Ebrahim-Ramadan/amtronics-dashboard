"use client"

import { useState } from "react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Eye } from "lucide-react"
import type { Order, OrderItem, ProjectBundleItem } from "@/app/page"
import { toast } from "sonner"
import dynamic from "next/dynamic"

const OrderDetailsModal = dynamic(
  () => import("./order-details-modal").then((mod) => mod.OrderDetailsModal),
  { ssr: false, loading: () => null }
)

interface OrdersTableProps {
  orders: Order[]
}

export function OrdersTable({ orders }: OrdersTableProps) {
  console.log('orders', orders);
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getItemsCount = (items: (OrderItem | ProjectBundleItem)[]) => {
    return items.reduce((total, item) => {
      if ("product" in item) return total + item.quantity
      if ("products" in item && Array.isArray(item.products)) return total + item.quantity * item.products.length
      return total
    }, 0)
  }

// Correct subtotal for project-bundle items
const getItemsSubtotal = (items: (OrderItem | ProjectBundleItem)[]) => {
  return items.reduce((total, item) => {
    if ("product" in item) {
      return total + item.product.price * item.quantity;
    } else if ("products" in item && Array.isArray(item.products)) {
      // Sum (product.price * product.quantity) for each product, then multiply by bundle quantity
      const bundleSum = item.products.reduce(
        (sum, p) => sum + (p.price || 0) * (p.quantity || 1),
        0
      );
      return total + item.quantity * bundleSum;
    }
    return total;
  }, 0);
};

  const getCalculatedTotal = (order: Order) => {
    const subtotal = getItemsSubtotal(order.items)
    return subtotal - (order.discount || 0)
  }

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
    setModalOpen(true)
  }

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    toast.success(`Order ID ${id.slice(-8)} copied to clipboard`)
  }

  if (orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No pending orders found</p>
          <p className="text-sm">Try adjusting your search criteria</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto px-2 md:px-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>SubTotal</TableHead>
              {/* <TableHead>Shipping</TableHead> */}
              <TableHead>Paid</TableHead>
              <TableHead>Promo</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order._id}>
                <TableCell
                  className="font-mono text-sm cursor-pointer hover:text-blue-600"
                  onClick={() => handleCopyId(order._id)}
                >
                  {order._id.slice(-8)}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{order.customerInfo.name}</div>
                    <div className="text-sm text-gray-500">{order.customerInfo.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-400" />
                    <span>{getItemsCount(order.items)} items</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">
  KWD {order.total?.toFixed(2) ?? "0.00"}
  {order.discount > 0 && (
    <div className="text-sm text-green-600">-KWD {order.discount.toFixed(2)} discount</div>
  )}
</TableCell>
                {/* <TableCell className="font-medium">
                  KWD{order.shippingFee?.toFixed(2) ?? "0.00"}
                </TableCell> */}
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={
                      order.paymentMethod === "cod"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {order.paymentMethod == "cod" ? "COD" : "in shop (KNET)"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {order.promoCode || <span className="text-gray-400">—</span>}
                </TableCell>
                <TableCell className="text-sm text-gray-500">{formatDate(order.createdAt)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => handleViewOrder(order)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <OrderDetailsModal order={selectedOrder} open={modalOpen} onOpenChange={setModalOpen} />
    </>
  )
}
