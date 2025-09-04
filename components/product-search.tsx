"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { useState, useTransition, useRef } from "react"
import { Loader2 } from "lucide-react"
import type { Product } from "@/app/products/page"

export function ProductSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "")
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced suggestion fetch
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!value.trim()) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(value)}&limit=8`)
        if (res.ok) {
          const data = await res.json()
          setSuggestions(data.products || [])
          setShowDropdown(true)
        }
      } catch {
        setSuggestions([])
        setShowDropdown(false)
      } finally {
        setLoading(false)
      }
    }, 500)
  }

  // Search on Enter or button click
  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (searchValue) {
      params.set("search", searchValue)
    } else {
      params.delete("search")
    }
    params.delete("page")
    setShowDropdown(false)
    startTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }



  // Optional: select suggestion to search
  const handleSuggestionClick = (product: Product) => {
    setSearchValue(product.en_name)
    setShowDropdown(false)
    const params = new URLSearchParams(searchParams.toString())
    params.set("search", product.en_name)
    params.delete("page")
    startTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        placeholder="Search Product by ID, Name, or SKU..."
        value={searchValue}
        onChange={handleInputChange}
        // onKeyDown={handleKeyDown}
        className="pl-10 w-full"
        disabled={isPending}
        autoComplete="off"
        onFocus={() => searchValue && setShowDropdown(true)}
      />
      <Button
        className="absolute right-0 top-0 h-full rounded-l-none"
        onClick={handleSearch}
        disabled={isPending}
        type="button"
      >
        <Search />
      </Button>
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center">
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              <span className="text-sm text-gray-500">Searching...</span>
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((product) => (
              <div
                key={product._id}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                onClick={() => handleSuggestionClick(product)}
              >
                <div className="font-medium text-sm">{product.en_name}</div>
                <div className="text-xs text-gray-500">
                  ID: {product.id} • SKU: {product.sku}
                </div>
              </div>
            ))
          ) : (
            <div className="p-3 text-center text-sm text-gray-500">
              No products found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
