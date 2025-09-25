import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  const { product_id, variety } = await request.json(); // Destructure variety object
  console.log('Received data for adding variety:', { product_id, variety });

  try {
    const client = await clientPromise;
    const db = client.db("amtronics");

    // Fetch the current product to check the varieties field
    const product = await db.collection('products').findOne({ _id: new ObjectId(product_id) });
    if (!product) {
      return NextResponse.json({ message: 'Product not found.' }, { status: 404 });
    }

    // Ensure varieties is an array
    const currentVarieties = Array.isArray(product.varieties) ? product.varieties : [];

    // Update the product to include the new variety in the varieties array
    const result = await db.collection('products').updateOne(
      { _id: new ObjectId(product_id) }, // Find the product by ID
      { $set: { varieties: [...currentVarieties, variety], hasVarieties: true } } // Push the new variety into the varieties array and set hasVarieties to true
    );
    console.log('Update result for adding variety:', result);

    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: 'Product not found or variety not added.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Variety added successfully!' }, { status: 201 });
  } catch (error) {
    console.error("Error adding variety:", error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { product_id, varieties } = await request.json(); // Destructure product_id and varieties array
  console.log('Received data for updating varieties:', { product_id, varieties });

  try {
    const client = await clientPromise;
    const db = client.db("amtronics");

    // Check if varieties is an array
    if (!Array.isArray(varieties)) {
      return NextResponse.json({ message: 'Varieties must be an array.' }, { status: 400 });
    }

    // Update the product's varieties array
    const result = await db.collection('products').updateOne(
      { _id: new ObjectId(product_id) }, // Find the product by ID
      { $set: { varieties: varieties } } // Update the varieties array
    );
    console.log('Update result for updating varieties:', result);

    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: 'Product not found or varieties not updated.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Varieties updated successfully!' }, { status: 200 });
  } catch (error) {
    console.error("Error updating varieties:", error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { product_id, variety_index } = await request.json(); // Destructure product_id and variety_index
  console.log('Received data for deleting variety:', { product_id, variety_index });

  try {
    const client = await clientPromise;
    const db = client.db("amtronics");

    // Fetch the current product
    const product = await db.collection('products').findOne({ _id: new ObjectId(product_id) });
    if (!product) {
      return NextResponse.json({ message: 'Product not found.' }, { status: 404 });
    }

    // Remove the variety at the specified index
    const updatedVarieties = product.varieties.filter((_, index) => index !== variety_index);

    // Update the product with the new varieties array
    const result = await db.collection('products').updateOne(
      { _id: new ObjectId(product_id) },
      { $set: { varieties: updatedVarieties } }
    );

    console.log('Update result for deleting variety:', result);

    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: 'Variety not deleted.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Variety deleted successfully!' }, { status: 200 });
  } catch (error) {
    console.error("Error deleting variety:", error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

