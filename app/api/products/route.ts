import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from 'mongodb'

// Interface for Product (should match the one in app/products/page.tsx)
export interface Product {
  _id?: string // MongoDB ObjectId
  id: number
  barcode?: number
  sku: string
  en_name: string
  ar_name: string
  en_description: string
  ar_description: string
  price: number
  image: string
  quantity_on_hand: number
  sold_quantity: number
  visible_in_catalog: number
  visible_in_search: number
  slug_url: string
  discount?: number
  discount_type?: string
  ar_brand?: string
  en_brand?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams,  } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const projectbundleproducts = searchParams.get("projectbundleproducts") || ""

    const client = await clientPromise
    const db = client.db("amtronics")
    const collection = db.collection("products") // Assuming 'products' collection

    const query: any = {}

    // if (search) {
    //   query.$or = [
    //     { "en_name": { $regex: search, $options: "i" } },
    //     { "ar_name": { $regex: search, $options: "i" } },
    //     { "sku": { $regex: search, $options: "i" } },
    //     { "barcode": Number(search) || 0 },
    //     // { "_id": new ObjectId(search) }, // Instantiate ObjectId
    //     { "id": Number(search) }, // Convert search to number for Int32
    //   ];
    // }
    if (search) {
      query.$or = [
        { "en_name": { $regex: search, $options: "i" } },
        { "ar_name": { $regex: search, $options: "i" } },
        { "sku": { $regex: search, $options: "i" } },
        { "barcode": Number(search) || 0 },
        { "_id": /^[0-9a-fA-F]{24}$/.test(search) ? new ObjectId(search) : null }, // Only apply if valid ObjectId
        { "id": Number(search) }, // Match exact Int32
      ].filter(Boolean); // Filter out null values for _id
    }
    const skip = (page - 1) * limit

    // Define projection to only include specific product fields
    let projection : any 
    if( projectbundleproducts === "true" ) {
    console.log("hell yeah", projectbundleproducts);
     projection = {
      _id: 1,
      en_name: 1,
      ar_name: 1,
      sku: 1,
      price: 1,
    }
    }
    else{
  projection = {
      _id: 1,
      id: 1,
      sku: 1,
      en_name: 1,
      ar_name: 1,
      en_description: 1,
      ar_description: 1,
      en_long_description: 1,
      ar_long_description: 1,
      en_main_category: 1,
      ar_main_category: 1,
      en_category: 1,
      ar_category: 1,
      price: 1,
      image: 1,
      quantity_on_hand: 1,
      sold_quantity: 1,
      visible_in_catalog: 1,
      visible_in_search: 1,
      slug_url: 1,
      discount: 1,
      discount_type: 1,
      ar_brand: 1,
      en_brand: 1,
      barcode: 1,
    }
    }
   

    const [products, totalCount] = await Promise.all([
      collection.find(query).project(projection).skip(skip).limit(limit).toArray(),
      collection.countDocuments(query),
    ])

    const transformedProducts = products.map((product) => ({
      ...product,
      _id: product._id.toString(),
    }))

    return NextResponse.json({ products: transformedProducts, totalCount }, { status: 200 })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const productData: Product = await request.json()

    const client = await clientPromise
    const db = client.db("amtronics")
    const collection = db.collection("products")

    // Basic validation
    if (!productData.en_name || !productData.price || !productData.quantity_on_hand) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Ensure id and barcode are numbers if they exist, and generate them if not provided
    const newProduct = {
      ...productData,
      id: productData.id || await collection.countDocuments() + 1, // Simple auto-increment
      sold_quantity: 0, // Initialize sold_quantity
      createdAt: new Date(),
    }

    // Destructure to omit _id and barcode before inserting if it somehow exists
    const { _id, barcode, ...dataToInsert } = newProduct;

    const result = await collection.insertOne(dataToInsert)

    return NextResponse.json({ message: "Product added successfully", productId: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error("Error adding product:", error)
    return NextResponse.json({ error: "Failed to add product" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const productData: Product = await request.json();

    if (!productData._id) {
      return NextResponse.json({ message: "Missing product ID for update" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("amtronics");
    const collection = db.collection("products");

    const { _id, id, barcode, ...updateData } = productData; // Exclude id and barcode from updateData

    // Convert to numbers if they exist in updateData and are not already numbers
    if (updateData.price !== undefined && typeof updateData.price === 'string') {
      updateData.price = Number(updateData.price);
    }
    if (updateData.quantity_on_hand !== undefined && typeof updateData.quantity_on_hand === 'string') {
      updateData.quantity_on_hand = Number(updateData.quantity_on_hand);
    }
    if (updateData.sold_quantity !== undefined && typeof updateData.sold_quantity === 'string') {
      updateData.sold_quantity = Number(updateData.sold_quantity);
    }
    if (updateData.visible_in_catalog !== undefined && typeof updateData.visible_in_catalog === 'string') {
      updateData.visible_in_catalog = Number(updateData.visible_in_catalog);
    }
    if (updateData.visible_in_search !== undefined && typeof updateData.visible_in_search === 'string') {
      updateData.visible_in_search = Number(updateData.visible_in_search);
    }
    if (updateData.discount !== undefined && typeof updateData.discount === 'string') {
      updateData.discount = Number(updateData.discount);
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Product updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id }: { id: string } = await request.json()

    if (!id) {
      return NextResponse.json({ message: "Missing product ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("amtronics")
    const collection = db.collection("products")

    const result = await collection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Product deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
} 