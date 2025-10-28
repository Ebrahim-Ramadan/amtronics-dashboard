import dynamic from "next/dynamic";
import clientPromise from "@/lib/mongodb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// client components
const ExpensesTable = dynamic(() => import('@/components/expenses/ExpensesTable'), );
const ExpenseForm = dynamic(() => import('@/components/expenses/ExpenseForm'), );

const Topleftmenu = dynamic(() => import('@/components/top-left-menu'));

export default async function ExpensesPage() {
  const client = await clientPromise;
  const db = client.db("amtronics");
  const expenses = await db
    .collection("expenses")
    .find({})
    .sort({ date: -1 })
    .toArray();

  // Convert dates to ISO strings for props
  const serialized = expenses.map(e => ({
    _id: e._id.toString(),
    name: e.name,
    cost: e.cost,
    quantity: e.quantity,
    note: e.note,
    date: e.date ? new Date(e.date).toISOString() : null,
    createdAt: e.createdAt ? new Date(e.createdAt).toISOString() : null,
  }));

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
            {/* server-side data passed into client table/form */}
            <div className="space-y-4">
              {/* ExpenseForm without initial expense acts as "Add" */}
              <ExpenseForm initialExpense={null} />
              <ExpensesTable initialExpenses={serialized} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}