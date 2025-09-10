"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Banknote, Package } from "lucide-react"
import { OrdersTable } from "@/components/orders-table"
import { Pagination } from "@/components/pagination"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import dynamic from "next/dynamic"
import { Order } from "@/app/completed-orders/page"
import SearchAndSort from "./search-and-sort"

const FeesModal = dynamic(() => import("@/components/fees-modal"), { ssr: false })

interface CompletedOrdersViewProps {
  orders: Order[]
  totalCount: number
  totalValue: number
  currentPage: number
  totalPages: number
  promoCodes?: string[]
  paymentMethod?: string // <-- Added field
}

export function CompletedOrdersView({ orders, totalCount, totalValue, currentPage, totalPages, promoCodes, paymentMethod }: CompletedOrdersViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [totalFees, setTotalFees] = useState(0)
  const [isCalculated, setIsCalculated] = useState(false)

  const handleFeesSubmit = (newTotalFees: number) => {
    setTotalFees(newTotalFees)
    setIsCalculated(true)
  }

  // Calculate total sales and average cost considering project-based orders and regular orders
  const totalSales = orders.reduce((sum, order) =>
    sum + order.items.reduce((itemSum, item) => {
      if (item.type === "project-bundle" && item.products) {
        // Sum prices of all products inside the project bundle times the bundle quantity
        return itemSum + item.products.reduce((prodSum, prod) => prodSum + prod.price * item.quantity, 0)
      } else {
        // Normal product
        return itemSum + (item.product?.price || 0) * item.quantity
      }
    }, 0), 0)

  const totalAveCost = orders.reduce((sum, order) =>
    sum + order.items.reduce((itemSum, item) => {
      if (item.type === "project-bundle" && item.products) {
        // Sum average cost of all products inside the project bundle times the bundle quantity
        return itemSum + item.products.reduce((prodSum, prod) => prodSum + (prod.ave_cost || 0) * item.quantity, 0)
      } else {
        // Normal product
        return itemSum + ((item.product?.ave_cost || 0) * item.quantity)
      }
    }, 0), 0)

  const netProfit = totalSales - (totalAveCost + totalFees)

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
                (Total Sales - (Total Ave. Cost + Your Fees))<br />
                KD {totalSales.toFixed(2)} - (KD {totalAveCost.toFixed(2)} + KD {totalFees.toFixed(2)})
              </p>
            </CardContent>
          </Card>
        )}
      </div>
   {/* Display Payment Method */}
      {paymentMethod && (
        <div className="mb-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg">{paymentMethod}</div>
            </CardContent>
          </Card>
        </div>
      )}
      <FeesModal open={isModalOpen} onOpenChange={setIsModalOpen} onSubmit={handleFeesSubmit} />

      {/* Pass promoCodes to SearchAndSort */}
      <div className="mb-4">
        <SearchAndSort promoCodes={promoCodes} />
      </div>

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
