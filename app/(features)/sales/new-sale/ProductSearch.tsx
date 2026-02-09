import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductForSale {
  id: string;
  name: string;
  price: number;
  stock: number;
  variantId: number;
}

interface ProductSearchProps {
  products: ProductForSale[];
  onAddProduct: (product: ProductForSale) => void;
}

export const ProductSearch = ({
  products,
  onAddProduct,
}: ProductSearchProps) => {
  const [searchProduct, setSearchProduct] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchProduct.toLowerCase()),
  );

  const handleAddProduct = (product: ProductForSale) => {
    onAddProduct(product);
    setShowProductSearch(false);
    setSearchProduct("");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Products</h2>
        <p>Need barcode here </p>
        <Button
          onClick={() => setShowProductSearch(!showProductSearch)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          Add Product
        </Button>
      </div>

      {showProductSearch && (
        <div className="mb-4 relative">
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-background">
            <Search size={20} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              className="flex-1 outline-none bg-transparent"
            />
          </div>
          {searchProduct && (
            <div className="absolute z-10 w-full mt-1 bg-card border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <button
                    key={`${product.id}-${product.variantId}`}
                    onClick={() => handleAddProduct(product)}
                    className="w-full px-4 py-3 text-left hover:bg-accent border-b last:border-b-0 transition-colors"
                  >
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      ${product.price.toFixed(2)} - Stock: {product.stock}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-muted-foreground text-center">
                  No products found
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
