import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

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

    // Optional: validate engineers is array and structure here

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

    // Get engineerEmail from query params
    const { searchParams } = new URL(request.url);
    const engineerEmail = searchParams.get("engineerEmail");

    let query: any = {};
    if (engineerEmail) {
      query = {
        engineers: {
          $elemMatch: { email: engineerEmail }
        }
      };
    }

    // Only return id, name, engineers, quantities_sold
    const projects = await collection.find(query, {
      projection: {
        _id: 1,
        name: 1,
        engineers: 1,
        quantities_sold: 1,
      }
    }).toArray();
console.log('Fetched projects:', projects);

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
    // Validate body: should have name, engineers (array), each engineer has name and bundle (array of products with id, name, image, price)
    if (!body.name || !Array.isArray(body.engineers)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    // Optionally validate each engineer and bundle
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
