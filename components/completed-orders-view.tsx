"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Banknote, Package } from "lucide-react"
import { OrdersTable } from "@/components/orders-table"
import { Pagination } from "@/components/pagination"
import { Button } from "@/components/ui/button"
// import { FeesModal } from "@/components/fees-modal"
import { Order } from "@/app/completed-orders/page"
import Image from "next/image"
import dynamic from "next/dynamic"

const FeesModal = dynamic(() => import("@/components/fees-modal"), { ssr: false })
interface CompletedOrdersViewProps {
  orders: Order[]
  totalCount: number
  totalValue: number
  currentPage: number
  totalPages: number
}

export function CompletedOrdersView({ orders, totalCount, totalValue, currentPage, totalPages }: CompletedOrdersViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [totalFees, setTotalFees] = useState(0)
  const [isCalculated, setIsCalculated] = useState(false)

  const handleFeesSubmit = (newTotalFees: number) => {
    setTotalFees(newTotalFees)
    setIsCalculated(true)
  }

  // Calculate net profit: (sum of product price * quantity) - (sum of ave_cost * quantity + shippingFee + totalFees)
  const totalSales = orders.reduce((sum, order) =>
    sum + order.items.reduce((itemSum, item) => itemSum + item.product.price * item.quantity, 0), 0)
  const totalAveCost = orders.reduce((sum, order) =>
    sum + order.items.reduce((itemSum, item) => itemSum + (item.product.ave_cost || 0) * item.quantity, 0), 0)
  const totalShipping = orders.reduce((sum, order) => sum + (order.shippingFee || 0), 0)
  const netProfit = totalSales - (totalAveCost + totalShipping + totalFees)

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Completed Orders</CardTitle>
            <Image src="/statistics.svg" alt="Statistics" width={24} height={24} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Shown / Current Page</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.length} / ({currentPage} of {totalPages})
            </div>
          </CardContent>
        </Card> */}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value of Completed Orders</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KD {totalValue.toFixed(2)}</div>
            <Button size="sm" variant="outline" className="mt-2 text-xs" onClick={() => setIsModalOpen(true)}>
              Calculate Net Profit
            </Button>
          </CardContent>
        </Card>

        {isCalculated && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <Banknote className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">KD {netProfit.toFixed(2)}</div>
              <p className="text-[10px] text-muted-foreground">
                (Total Sales - (Total Ave. Cost + Total Shipping + Your Fees))<br/>
                KD {totalSales.toFixed(2)} - (KD {totalAveCost.toFixed(2)} + KD {totalShipping.toFixed(2)} + KD {totalFees.toFixed(2)})
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <FeesModal open={isModalOpen} onOpenChange={setIsModalOpen} onSubmit={handleFeesSubmit} />

      <Card>
        <CardHeader>
          <CardTitle>Completed Orders</CardTitle>
        </CardHeader>
        <OrdersTable orders={orders} />
      </Card>

      <Pagination currentPage={currentPage} totalPages={totalPages} totalCount={totalCount} />
    </>
  )
} 