import React from 'react'
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from './ui/button'
import { Menu } from 'lucide-react'
import { LogoutButton } from './logout-button'
export const Topleftmenu = () => {
  return ( 
  <DropdownMenu modal={true}>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" aria-label="Menu">
        <Menu className="h-6 w-6" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-56">
      <DropdownMenuItem asChild>
        <Link href="/">
          Orders Dashboard
        </Link>
      </DropdownMenuItem>
       <DropdownMenuItem asChild>
        <Link href="/promocodes">
          Promo Codes
        </Link>
      </DropdownMenuItem>
       {/* Future Products Link */}
       <DropdownMenuItem asChild>
        <Link href="/products">
          Products
        </Link>
      </DropdownMenuItem>
       <DropdownMenuItem asChild>
       <LogoutButton />
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
    
  )
}
