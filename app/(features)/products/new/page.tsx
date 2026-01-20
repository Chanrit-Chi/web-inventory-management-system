import { SharedLayout } from "@/components/shared-layout";
import ProductForm from "./components/product-form";

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
