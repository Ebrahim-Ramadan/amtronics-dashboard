import { type NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// --- Analytics Helper ---
function getAnalyticsPipeline({ year, month, day }: { year?: number; month?: number; day?: number }) {
  const pipeline: any[] = [];
  const match: any = { status: "completed" }; // Only include completed orders

  if (year) {
    match["$expr"] = { $eq: [{ $year: "$createdAt" }, year] };
    if (month) {
      match["$expr"] = {
        $and: [
          { $eq: [{ $year: "$createdAt" }, year] },
          { $eq: [{ $month: "$createdAt" }, month] },
        ],
      };
      if (day) {
        match["$expr"].$and.push({ $eq: [{ $dayOfMonth: "$createdAt" }, day] });
      }
    }
  }

  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  let groupId: any = {};
  if (year && month && day) {
    groupId = {
      year: { $year: "$createdAt" },
      month: { $month: "$createdAt" },
      day: { $dayOfMonth: "$createdAt" },
    };
  } else if (year && month) {
    groupId = {
      year: { $year: "$createdAt" },
      month: { $month: "$createdAt" },
      day: { $dayOfMonth: "$createdAt" },
    };
  } else if (year) {
    groupId = {
      year: { $year: "$createdAt" },
      month: { $month: "$createdAt" },
    };
  } else {
    groupId = {
      year: { $year: "$createdAt" },
    };
  }

  pipeline.push({ $group: { _id: groupId, count: { $sum: 1 } } });
  pipeline.push({ $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } });
  return pipeline;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year") ? Number(searchParams.get("year")) : undefined;
    const month = searchParams.get("month") ? Number(searchParams.get("month")) : undefined;
    const day = searchParams.get("day") ? Number(searchParams.get("day")) : undefined;

    const client = await clientPromise;
    const db = client.db("amtronics");
    const collection = db.collection("orders");

    const pipeline = getAnalyticsPipeline({ year, month, day });
    const result = await collection.aggregate(pipeline).toArray();

    let analytics = result;

    // Fill missing periods with zero counts
    if (year && !month && !day) {
      // Fill all 12 months
      const monthMap = new Map(result.map((r) => [r._id.month, r.count]));
      analytics = Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        return {
          _id: { year, month: m },
          count: monthMap.get(m) || 0,
        };
      });
    } else if (year && month && !day) {
      // Fill all 31 days
      const dayMap = new Map(result.map((r) => [r._id.day, r.count]));
      analytics = Array.from({ length: 31 }, (_, i) => {
        const d = i + 1;
        return {
          _id: { year, month, day: d },
          count: dayMap.get(d) || 0,
        };
      });
    }

    return NextResponse.json({ analytics }, { status: 200 });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}