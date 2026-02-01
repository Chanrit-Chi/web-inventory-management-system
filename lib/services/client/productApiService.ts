import {
  ProductCreateSchema,
  ProductUpdateSchema,
} from "@/schemas/product.schema";
import {
  Product,
  ProductCreate,
  ProductUpdate,
  ProductCreateRequest,
} from "@/schemas/type-export.schema";

export const productApiService = {
  addProduct: async (request: ProductCreateRequest): Promise<Product> => {
    const validateProduct = ProductCreateSchema.parse(request.productData);
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productData: validateProduct,
        attributeSelections: request.attributeSelections,
      }),
    });

    if (!res.ok) {
      const error = await res
        .json()
        .catch(() => ({ error: "Failed to add product" }));
      throw new Error(error.error || "Failed to add product");
    }

    return res.json();
  },

  fetchProducts: async (
    page: number = 1,
    limit: number = 10,
    search?: string,
    filters?: Record<string, string>
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) {
      params.append("search", search);
    }

    if (filters) {
      if (filters.isActive) params.append("isActive", filters.isActive);
      if (filters.category) params.append("category", filters.category);
    }

    const res = await fetch(`/api/products?${params.toString()}`);

    if (!res.ok) {
      throw new Error("Failed to fetch products");
    }

    return res.json();
  },

  fetchProductById: async (id: string): Promise<Product> => {
    const res = await fetch(`/api/products/${id}`);

    if (!res.ok) {
      throw new Error(`Failed to fetch product with id ${id}`);
    }

    return res.json();
  },

  updateProduct: async (
    id: string,
    product: ProductUpdate
  ): Promise<Product> => {
    const validateProduct = ProductUpdateSchema.parse(product);
    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validateProduct),
    });

    if (!res.ok) {
      const error = await res
        .json()
        .catch(() => ({ error: "Failed to update product" }));
      throw new Error(error.error || `Failed to update product with id ${id}`);
    }

    return res.json();
  },

  deleteProduct: async (id: string): Promise<void> => {
    const res = await fetch(`/api/products/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      throw new Error(`Failed to delete product with id ${id}`);
    }
  },
};
