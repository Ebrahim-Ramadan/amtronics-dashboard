import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Eye } from "lucide-react"
import type { Order, OrderItem } from "@/app/page"

interface OrdersTableProps {
  orders: Order[]
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getItemsCount = (items: OrderItem[]) => {
    return items.reduce((total, item) => total + item.quantity, 0)
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
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order._id}>
              <TableCell className="font-mono text-sm">{order._id.slice(-8)}</TableCell>
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
                ${order.total.toFixed(2)}
                {order.discount > 0 && (
                  <div className="text-sm text-green-600">-${order.discount.toFixed(2)} discount</div>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  {order.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-500">{formatDate(order.createdAt)}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
