'use client'
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from './ui/button';
import { LayoutDashboard, Ticket, Package,  Menu, TableColumnsSplit, CheckCircle, AlignVerticalJustifyStart, PersonStanding, Projector } from 'lucide-react';
import { LogoutButton } from './logout-button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export const Topleftmenu = () => {
  const pathname = usePathname();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open navigation menu"
          className=" rounded-full transition-colors"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-64 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 font-medium transition-all duration-200 ease-in-out transform origin-top scale-95 hover:scale-100 space-y-1"
      >
        <DropdownMenuItem asChild>
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors",
              pathname === '/' && 'bg-gray-100 text-blue-600'
            )}
            aria-current={pathname === '/' ? 'page' : undefined}
          >
            <LayoutDashboard className="h-4 w-4" />
           Pending Orders
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/completed-orders"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors",
              pathname === '/completed-orders' && 'bg-gray-100 text-blue-600'
            )}
            aria-current={pathname === '/completed-orders' ? 'page' : undefined}
          >
            <CheckCircle   className="h-4 w-4" />
            Completed Orders
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/promocodes"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors",
              pathname === '/promocodes' && 'bg-gray-100 text-blue-600'
            )}
            aria-current={pathname === '/promocodes' ? 'page' : undefined}
          >
            <Ticket className="h-4 w-4" />
            Promo Codes
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/products"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors",
              pathname === '/products' && 'bg-gray-100 text-blue-600'
            )}
            aria-current={pathname === '/products' ? 'page' : undefined}
          >
            <Package className="h-4 w-4" />
            Products
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/analytics"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors",
              pathname === '/analytics' && 'bg-gray-100 text-blue-600'
            )}
            aria-current={pathname === '/analytics' ? 'page' : undefined}
          >
            <AlignVerticalJustifyStart className="h-4 w-4" />
            Analytics
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/customers"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors",
              pathname === '/customers' && 'bg-gray-100 text-blue-600'
            )}
            aria-current={pathname === '/customers' ? 'page' : undefined}
          >
            <PersonStanding className="h-4 w-4" />
            Customers
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/projects"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors",
              pathname === '/projects' && 'bg-gray-100 text-blue-600'
            )}
            aria-current={pathname === '/projects' ? 'page' : undefined}
          >
            <Projector className="h-4 w-4" />
            Projects
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <LogoutButton
            // className="flex items-center gap-2 px-3 py-2 w-full text-left rounded-md hover:bg-gray-100 transition-colors"
            // icon={<LogOut className="h-4 w-4" />}
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Topleftmenu 