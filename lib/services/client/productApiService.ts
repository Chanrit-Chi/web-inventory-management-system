import { Product } from "@/schemas/type-export.schema";

export const productApiService = {
  addProduct: async (product: Product): Promise<Product> => {
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });
      if (!res.ok) {
        throw new Error("Failed to add product");
      }
      const data = await res.json();
      return data;
    } catch (error) {
      console.error("Error adding product:", error);
      throw error;
    }
  },

  fetchProducts: async (): Promise<Product[]> => {
    try {
      const res = await fetch("/api/products");
      if (!res.ok) {
        throw new Error("Failed to fetch products");
      }
      const data = await res.json();
      return data;
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  },
};
