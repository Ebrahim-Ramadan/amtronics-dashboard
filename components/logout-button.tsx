"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useState } from "react"

export function LogoutButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
      })

      if (response.ok) {
        // Redirect to login page on successful logout
        router.push("/login")
      } else {
        // Handle logout error if necessary (e.g., show a message)
        console.error("Logout failed")
      }
    } catch (error) {
      console.error("An unexpected error occurred during logout", error)
    }
    setIsLoading(false)
  }

  return (
    <Button variant="destructive"  size='sm' className="flex items-center gap-2 px-3 py-2 w-full text-left rounded-md hover:bg-red-400 mt-4 transition-colors" onClick={handleLogout} disabled={isLoading}>
      {/* <LogOut className="h-2 w-2" /> */}
      {isLoading ? "Logging Out..." : "Logout"}
      <LogOut className="h-4 w-4" />
    </Button>
  )
} 