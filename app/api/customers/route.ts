import { type NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db("amtronics");
    const collection = db.collection("orders");

    // Aggregate unique customers by email (or name+email)
    const pipeline = [
      {
        $group: {
          _id: {
            email: "$customerInfo.email",
            name: "$customerInfo.name",
            phone: "$customerInfo.phone",
            city: "$customerInfo.city",
            area: "$customerInfo.area",
          },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.name": 1 } },
      { $skip: skip },
      { $limit: limit },
    ];
    const customers = await collection.aggregate(pipeline).toArray();

    // Get total unique customers
    const totalUnique = await collection.distinct("customerInfo.email");
    const totalCount = totalUnique.length;

    // Format response
    const formatted = customers.map((c) => ({
      name: c._id.name,
      email: c._id.email,
      phone: c._id.phone,
      city: c._id.city,
      area: c._id.area,
      orderCount: c.orderCount,
    }));

    return NextResponse.json({ customers: formatted, totalCount, currentPage: page, totalPages: Math.ceil(totalCount / limit) }, { status: 200 });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
} 