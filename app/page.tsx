import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Package, Loader2 } from "lucide-react"
import { OrdersTable } from "@/components/orders-table"
import { SearchAndSort } from "@/components/search-and-sort"
import { Pagination } from "@/components/pagination"
import Image from "next/image"
import { Topleftmenu } from "@/components/top-left-menu"
import Link from "next/link"

export interface Product {
  _id: string
  id: number
  barcode: number
  sku: string
  en_name: string
  ar_name: string
  en_description: string
  ar_description: string
  price: number
  ave_cost?: number
  image: string
  quantity_on_hand: number
  sold_quantity: number
}

export interface OrderItem {
  product: Product
  quantity: number
}

export interface ProjectBundleItem {
  type: "project-bundle"
  projectName: string
  projectId: string
  engineerNames: string[]
  products: Product[]
  quantity: number
  bundleIds?: string[]
}

export type Item = OrderItem | ProjectBundleItem

export interface CustomerInfo {
  name: string
  phone: string
  email: string
  country: string
  city: string
  area: string
  block: string
  street: string
  house: string
}

export interface Order {
  _id: string
  items: Item[]
  customerInfo: CustomerInfo
  total: number
  discount: number
  promoCode: string
  status: string
  createdAt: string
  shippingFee: number
}

interface OrdersResult {
  orders: Order[]
  totalCount: number
  currentPage: number
  totalPages: number
}

interface PageProps {
  searchParams: {
    page?: string
    sort?: "latest" | "oldest"
    search?: string
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
        <Link href="/projects" passHref legacyBehavior>
          <a style={{ textDecoration: 'none' }}>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Package className="w-6 h-6 text-blue-500" />
                  <span>Manage project bundles and engineers</span>
                </div>
              </CardContent>
            </Card>
          </a>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SortingLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {i === 1 ? "Total Pending Orders" : "Orders Shown / Current Page"}
              </CardTitle>
              {i === 1 ? (
                <Clock className="h-4 w-4 text-muted-foreground" />
              ) : <Package className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">...</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="relative">
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-600">Sorting orders...</span>
          </div>
        </div>
        <CardHeader>
          <CardTitle className="opacity-50">Pending Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 opacity-50">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

async function OrdersDashboardContent({ searchParams }: PageProps) {
  const page = Number(searchParams.page) || 1
  const sort = searchParams.sort || "latest"
  const search = searchParams.search || ""

  const params = new URLSearchParams({
    page: page.toString(),
    limit: "10",
    sort,
    search,
  })

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/orders?${params}`, {
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error("Failed to fetch orders")
    }

    const { orders, totalCount, currentPage, totalPages }: OrdersResult = await response.json()
    console.log('Fetched orders:', orders);
    if (orders.length === 0) {
      return (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-lg font-medium text-gray-900">No orders found</p>
              <p className="text-sm text-gray-500">
                Try adjusting your search or sort criteria.
              </p>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pending Orders</CardTitle>
              <Image
                src="/statistics.svg"
                alt="Statistics"
                width={24}
                height={24}
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCount}</div>
            </CardContent>
          </Card>
                  <Link href="/projects" passHref legacyBehavior>
          <a style={{ textDecoration: 'none' }}>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Package className="w-6 h-6 text-blue-500" />
                  <span>Manage project bundles and engineers</span>
                </div>
              </CardContent>
            </Card>
          </a>
        </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending Orders</CardTitle>
          </CardHeader>
          <OrdersTable orders={orders} />
        </Card>

        <Pagination currentPage={currentPage} totalPages={totalPages} totalCount={totalCount} />
      </>
    )
  } catch (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-2">⚠️</div>
            <p className="text-lg font-medium text-gray-900">Failed to load orders</p>
            <p className="text-sm text-gray-500">Please check your database connection</p>
          </div>
        </CardContent>
      </Card>
    )
  }
}

function getSuspenseKey(searchParams: PageProps["searchParams"]) {
  const sort = searchParams.sort || "latest"
  const search = searchParams.search || ""
  const page = searchParams.page || "1"
  return `${sort}-${search}-${page}`
}

export default function OrdersDashboard({ searchParams }: PageProps) {
  const suspenseKey = getSuspenseKey(searchParams)
  const isInitialLoad = !searchParams.sort && !searchParams.search && !searchParams.page

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-6">
      <div className="w-full mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Topleftmenu />
            <h1 className="text-xl md:text-3xl font-bold text-gray-900">Pending Orders Dashboard</h1>
          </div>
          <SearchAndSort />
        </div>

        <Suspense key={suspenseKey} fallback={isInitialLoad ? <LoadingSkeleton /> : <SortingLoadingSkeleton />}>
          <OrdersDashboardContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  )
}