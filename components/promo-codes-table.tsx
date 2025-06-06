import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PromoCode } from "@/app/promocodes/page"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Trash2 } from 'lucide-react'

interface PromoCodesTableProps {
  promoCodes: PromoCode[]
  onUpdate?: () => void
}

export function PromoCodesTable({ promoCodes, onUpdate }: PromoCodesTableProps) {
  const [localPromoCodes, setLocalPromoCodes] = useState<PromoCode[]>([]);

  useEffect(() => {
    setLocalPromoCodes(promoCodes);
  }, [promoCodes]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setLocalPromoCodes(prevCodes =>
      prevCodes.map(code =>
        code._id === id ? { ...code, active: !currentStatus } : code
      )
    );

    try {
      const response = await fetch("/api/promocodes", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          active: !currentStatus,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(`Promo code ${!currentStatus ? 'enabled' : 'disabled'} successfully!`);
      } else {
        setLocalPromoCodes(prevCodes =>
          prevCodes.map(code =>
            code._id === id ? { ...code, active: currentStatus } : code
          ) as PromoCode[]
        );
        toast.error(result.message || "Failed to update promo code status.");
      }
    } catch (error) {
      console.error("Error updating promo code status:", error);
      setLocalPromoCodes(prevCodes =>
        prevCodes.map(code =>
          code._id === id ? { ...code, active: currentStatus } : code
        ) as PromoCode[]
      );
      toast.error("An unexpected error occurred.");
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    toast.success(`Order ID ${id.slice(-8)} copied to clipboard`)
  }

  const handleDelete = async (id: string, code: string) => {
    if (!window.confirm(`Are you sure you want to delete promo code ${code}?`)) {
      return;
    }
    const originalPromoCodes = localPromoCodes;
    setLocalPromoCodes(prevCodes => prevCodes.filter(promoCode => promoCode._id !== id));
    toast.info(`Deleting promo code ${code}...`);

    try {
      const response = await fetch("/api/promocodes", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Promo code ${code} deleted successfully!`);
      } else {
        setLocalPromoCodes(originalPromoCodes);
        toast.error(result.message || `Failed to delete promo code ${code}.`);
      }
    } catch (error) {
      console.error("Error deleting promo code:", error);
      setLocalPromoCodes(originalPromoCodes);
      toast.error(`An unexpected error occurred while deleting promo code ${code}.`);
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Percentage</TableHead>
          <TableHead>Expiry Date</TableHead>
          <TableHead>Active</TableHead>
          <TableHead>Status Toggle</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {localPromoCodes.map((promoCode) => (
          <TableRow key={promoCode._id}>
            <TableCell className="font-medium font-mono text-sm cursor-pointer hover:text-blue-600"  onClick={() => handleCopyId(promoCode.code)}>{promoCode.code}</TableCell>
            <TableCell>{promoCode.percentage}%</TableCell>
            <TableCell>{formatDate(promoCode.expiry)}</TableCell>
            <TableCell>
              <Badge variant={promoCode.active ? "default" : "destructive"}>
                {promoCode.active ? "Active" : "Inactive"}
              </Badge>
            </TableCell>
            <TableCell>
              <Switch
                checked={promoCode.active}
                onCheckedChange={() => handleToggleActive(promoCode._id, promoCode.active)}
              />
            </TableCell>
            <TableCell>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleDelete(promoCode._id, promoCode.code)}
                aria-label={`Delete promo code ${promoCode.code}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}