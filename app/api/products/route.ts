import { productService } from "@/lib/services/db/productDbService";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(
      1,
      Number.parseInt(searchParams.get("page") || "1", 10)
    );
    const limit = Math.max(
      1,
      Math.min(100, Number.parseInt(searchParams.get("limit") || "10", 10))
    );

    const products = await productService.fetchProducts(page, limit);
    console.log("Fetched products successfully:", products);

    return NextResponse.json({
      data: products,
      pagination: {
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("Received product data:", JSON.stringify(data, null, 2));
    const product = await productService.createProduct(data);
    return NextResponse.json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
