"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogoutButton } from "@/components/logout-button"
import { AddPromoCodeButton } from "@/components/add-promo-code-button"
import { PromoCodesTable } from "@/components/promo-codes-table"
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Topleftmenu } from "@/components/top-left-menu"

export interface PromoCode {
  _id: string
  code: string
  percentage: number
  expiry: string // Use string for Date from API
  active: boolean
  createdAt: string
}

export default function PromoCodesPage() {
  // const router = useRouter();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPromoCodes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/promocodes`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch promo codes");
      }

      const { promoCodes }: { promoCodes: PromoCode[] } = await response.json();
      setPromoCodes(promoCodes);
    } catch (err) {
      console.error("Error fetching promo codes:", err);
      setError("Failed to load promo codes. Please check the API route and database connection.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []); // Empty dependency array: runs only on mount

  const handleDataUpdate = () => {
    fetchPromoCodes(); // Refetch data after an update
    // router.refresh(); // Removed router.refresh()
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-6">
      <div className="w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 md:gap-4 w-full"> 
            <Topleftmenu/>

            <h1 className="text-xl md::text-3xl font-bold text-gray-900">Promo Codes</h1>
           
            </div>
            <p className="text-gray-600">Add and manage promo codes</p>
          </div>

          {/* Add New Promo Code Button */}
          <div className="flex items-center gap-4">
            <AddPromoCodeButton onSuccess={handleDataUpdate} />
          </div>
        </div>

        {/* Promo Codes List */}
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-red-500 mb-2">⚠️</div>
                <p className="text-lg font-medium text-gray-900">{error}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Promo Codes</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <PromoCodesTable promoCodes={promoCodes} onUpdate={handleDataUpdate} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 