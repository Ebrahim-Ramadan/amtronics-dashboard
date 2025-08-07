import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Topleftmenu } from "@/components/top-left-menu"
import { AddProductButton } from "@/components/add-product-button"
import { ProductSearch } from "@/components/product-search"
import { ProductDisplay } from "@/components/product-display"
import dynamic from "next/dynamic"
const Topleftmenu = dynamic(() => import('@/components/top-left-menu'))

export interface Product {
  _id: string
  id: number
  sku: string
  en_name: string
  ar_name: string
  en_description: string
  ar_description: string
  en_long_description: string
  ar_long_description: string
  en_main_category: string
  ar_main_category: string
  en_category: string
  ar_category: string
  price: number
  image: string
  quantity_on_hand: number
  sold_quantity: number
  visible_in_catalog: number
  visible_in_search: number
  slug_url: string
  discount?: number
  discount_type?: string
  ar_brand?: string
  en_brand?: string
  barcode?: number // Optional field for barcode
}

interface ProductsResult {
  products: Product[]
  totalCount: number
}

interface PageProps {
  searchParams: {
    page?: string
    search?: string
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
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

async function ProductsDashboardContent({ searchParams }: PageProps) {
  const search = searchParams.search?.trim() || ""

  if (!search.trim()) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900">Please search for a product by ID, Name, or SKU.</p>
            <p className="text-sm text-gray-500">Use the search bar above to find products.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const params = new URLSearchParams({
    limit: "1", // Only fetch one product by ID
    search: search.trim(),
  })

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/products?${params}`, {
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error("Failed to fetch products")
    }

    const { products, totalCount }: ProductsResult = await response.json()

    const product = products.length > 0 ? products[0] : null;

    return (
      <ProductDisplay initialProduct={product} />
    )
  } catch (error: any) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-2">⚠️</div>
            <p className="text-lg font-medium text-gray-900">Failed to load product</p>
            <p className="text-sm text-gray-500">Error: {error.message}. Please check your database connection or try again.</p>
          </div>
        </CardContent>
      </Card>
    )
  }
}

export default function ProductsDashboard({ searchParams }: PageProps) {
  const suspenseKey = `products-${searchParams.search || ""}` // Key depends only on search term

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-6">
      <div className="w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Topleftmenu/>
            <h1 className="text-xl md:text-3xl font-bold text-gray-900">Products Dashboard</h1>
          </div>

          {/* Search Bar and Add Product Button */}
          <div className="flex gap-2 w-full md:w-1/2 flex-col md:flex-row">
            <ProductSearch />
            <AddProductButton />
          </div>
        </div>

        <Suspense key={suspenseKey} fallback={<LoadingSkeleton />}>
          <ProductsDashboardContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  )
} 