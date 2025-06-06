"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, ArrowUpDown, Loader2 } from "lucide-react"
import { useState, useTransition, useEffect, useCallback } from "react"

export function SearchAndSort() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "")
  const [sortPending, setSortPending] = useState(false)

  const currentSort = (searchParams.get("sort") as "latest" | "oldest") || "latest"

  const updateSearchParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete("page")

      startTransition(() => {
        router.push(`?${params.toString()}`)
      })
    },
    [router, searchParams, startTransition]
  )


  const handleSortChange = (newSortString: string) => {
    const newSort = newSortString as "latest" | "oldest"
    setSortPending(true)
    updateSearchParams("sort", newSort)
  }

  return (
    <div className="flex items-center gap-4 flex-col md:flex-row">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search by customer name or email..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              updateSearchParams("search", searchValue);
            }
          }}
          className="pl-10 w-64"
          disabled={isPending}
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={isPending}>
            {sortPending && isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ArrowUpDown className="w-4 h-4 mr-2" />
            )}
            Sort: {currentSort === "latest" ? "Latest" : "Oldest"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value={currentSort} onValueChange={handleSortChange}>
            <DropdownMenuRadioItem value="latest">Latest First</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="oldest">Oldest First</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
