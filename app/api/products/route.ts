import { productDbService } from "@/lib/services/db/productDbService";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(
      1,
      Number.parseInt(searchParams.get("page") || "1", 10),
    );
    const limit = Math.max(
      1,
      Math.min(100, Number.parseInt(searchParams.get("limit") || "10", 10)),
    );
    const search = searchParams.get("search") || undefined;

    // Parse filters from query params
    const filters: Record<string, string> = {};
    const status = searchParams.get("isActive");
    const category = searchParams.get("category");

    if (status) filters.isActive = status;
    if (category) filters.category = category;

    const products = await productDbService.fetchProducts(
      page,
      limit,
      search,
      filters,
    );
    console.log("Fetched products successfully:", products);

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { productData, attributeSelections } = data;
    console.log("Received product data:", JSON.stringify(productData, null, 2));
    const product =
      await productDbService.createProductWithVariants(productData);
    return NextResponse.json(product);
  } catch (error: any) {
    console.error("Error creating product:", error);

    if (error.code === "P2002" && error.meta?.target) {
      const target = error.meta.target;
      return NextResponse.json(
        { error: `A product with this ${target} already exists.` },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;
    console.log("Received product update data:", JSON.stringify(data, null, 2));
    const product = await productDbService.updateProduct(id, updateData);
    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 },
    );
  }
}
