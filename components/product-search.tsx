"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { useState, useTransition } from "react"

export function ProductSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "")

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (searchValue) {
      params.set("search", searchValue)
    } else {
      params.delete("search")
    }
    params.delete("page") // Reset page when searching

    startTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        placeholder="Search Product by ID, Name, or SKU..."
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="pl-10 w-full"
        disabled={isPending}
      />
      <Button
        className="absolute right-0 top-0 h-full rounded-l-none"
        onClick={handleSearch}
        disabled={isPending}
      >
        <Search/>
      </Button>
    </div>
  )
}
 