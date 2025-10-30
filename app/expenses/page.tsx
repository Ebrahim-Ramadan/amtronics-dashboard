import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { headers } from "next/headers";

const ExpensesTable = dynamic(() => import('@/components/expenses/ExpensesTable'));
const ExpenseForm = dynamic(() => import('@/components/expenses/ExpenseForm'));
const Topleftmenu = dynamic(() => import('@/components/top-left-menu'));

export default async function ExpensesPage() {
  // Get host for absolute URL
  const host = headers().get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;

  const res = await fetch(`${baseUrl}/api/expenses`, {
    cache: "no-store",
  });
  const { expenses: serialized } = await res.json();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="w-full mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Topleftmenu />
          <h1 className="text-2xl font-bold">Expenses</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Manage Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ExpenseForm initialExpense={null} />
              <ExpensesTable initialExpenses={serialized} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}