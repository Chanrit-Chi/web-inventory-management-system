import { SharedLayout } from "@/components/shared-layout";
import NewProductForm from "./components/form";

export function NewProduct() {
  return (
    <div>
      <NewProductForm />
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
