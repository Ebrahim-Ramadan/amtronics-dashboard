import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// PATCH: Update an existing project
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, engineers } = body;

    if (!id) {
      return NextResponse.json({ error: "Project id is required" }, { status: 400 });
    }

    if (!name && !engineers) {
      return NextResponse.json({ error: "At least one of name or engineers must be provided" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("amtronics");
    const collection = db.collection("projects");

    const updateFields: any = {};
    if (name) updateFields.name = name;
    if (engineers) updateFields.engineers = engineers;

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const response = NextResponse.json({ message: "Project updated successfully" });
    // Add no-cache headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

// GET: List all projects, filter by engineerEmail if provided
export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("amtronics");
    const collection = db.collection("projects");
    const ordersCollection = db.collection("orders");

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const engineerEmail = searchParams.get("engineerEmail");
    const sub = searchParams.get("sub");
    const ids = searchParams.get("ids")?.split(",").map(id => id.trim()).filter(id => id) || []; // Trim and filter empty strings

    let query: any = {};
    let projection: any = {
      _id: 1,
      name: 1,
      engineers: 1,
      quantities_sold: 1,
    };

    // If sub=true, only return _id and name
    if (sub === "true") {
      projection = { _id: 1, name: 1 };
      if (ids.length > 0) {
        query = { _id: { $in: ids.map(id => new ObjectId(id)) } }; // Filter by provided IDs
      }
    } else if (engineerEmail) {
      query = { engineers: { $elemMatch: { email: engineerEmail } } };
    } else if (ids.length > 0) {
      query = { _id: { $in: ids.map(id => new ObjectId(id)) } }; // Also filter by IDs if not sub
    }

    const projects = await collection.find(query, { projection }).toArray();

    // For engineer view, calculate total_sales and paymentMethod
    if (engineerEmail && sub !== "true") {
      for (const project of projects) {
        const orders = await ordersCollection.find({
          "items.type": "project-bundle",
          "items.projectId": project._id.toString()
        }).toArray();

        let totalSales = 0;
        const paymentMethods: Set<string> = new Set();

        for (const order of orders) {
          if (order.paymentMethod) {
            paymentMethods.add(order.paymentMethod);
          }
          for (const item of order.items) {
            if (item.type === "project-bundle" && item.projectId === project._id.toString()) {
              if (Array.isArray(item.products)) {
                totalSales += item.products.reduce(
                  (sum: number, prod: any) => sum + (prod.price || 0) * (prod.quantity || 1),
                  0
                ) * (item.quantity || 1);
              }
            }
          }
        }
        project.total_sales = totalSales;
        project.paymentMethod = Array.from(paymentMethods);
      }
    }

    const response = NextResponse.json({ projects });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

// POST: Add a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name || !Array.isArray(body.engineers)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("amtronics");
    const collection = db.collection("projects");
    const result = await collection.insertOne({
      name: body.name,
      engineers: body.engineers,
      createdAt: new Date(),
    });
    
    const response = NextResponse.json({ message: "Project added", id: result.insertedId }, { status: 201 });
    // Add no-cache headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error("Error adding project:", error);
    return NextResponse.json({ error: "Failed to add project" }, { status: 500 });
  }
}

// DELETE: Remove a project by ID
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing project ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("amtronics");
    const result = await db.collection("projects").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const response = NextResponse.json({ message: "Project deleted" });
    // Add no-cache headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}