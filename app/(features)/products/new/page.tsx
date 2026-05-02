import ProductForm from "@/components/products/product-form";
import { SharedLayout } from "@/components/shared-layout";


export function NewProduct() {
  return (
    <div>
      <ProductForm />
    </div>
  );
}

export default function NewProductPage() {
  return (
    <SharedLayout>
      <NewProduct />
    </SharedLayout>
  );
}
