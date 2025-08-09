"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Banknote, Package, XCircle } from "lucide-react"
import { OrdersTable } from "@/components/orders-table"
import { Pagination } from "@/components/pagination"
import type { Order } from "@/app/page"

interface CanceledOrdersViewProps {
  orders: Order[]
  totalCount: number
  totalValue: number
  currentPage: number
  totalPages: number
}

export function CanceledOrdersView({ orders, totalCount, totalValue, currentPage, totalPages }: CanceledOrdersViewProps) {
  // Calculate total canceled value (for informational purposes)
  const totalCanceledValue = orders.reduce((sum, order) =>
    sum + order.items.reduce((itemSum, item) => {
      if ("products" in item && Array.isArray(item.products)) {
        // Project bundle item
        return itemSum + item.quantity * item.products.reduce((prodSum: number, prod: any) => prodSum + (prod.price || 0), 0)
      } else if ("product" in item) {
        // Individual product item
        return itemSum + (item.product?.price || 0) * item.quantity
      }
      return itemSum
    }, 0), 0)

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Canceled Orders</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Shown / Current Page</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length} / {currentPage}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Canceled Value</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">KD {totalCanceledValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Lost potential revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Canceled Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <OrdersTable orders={orders} />
        </CardContent>
      </Card>

      {/* Pagination */}
      <Pagination currentPage={currentPage} totalPages={totalPages} totalCount={totalCount} />
    </div>
  )
}
