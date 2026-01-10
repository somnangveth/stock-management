"use client";
import DialogForm from "@/app/components/dialogform";
import { RxPlusCircled } from "react-icons/rx";
import { btnStyle } from "@/app/components/ui";
import { useRouter } from "next/navigation";

export default function ProductForm({ 
  onProductAdded 
}: { 
  onProductAdded?: () => void 
}) {

  const router = useRouter();
  return (
        <button
        onClick={() => router.push("/staff/products/components/createproduct")}
          className={btnStyle}
        >
          <RxPlusCircled/> Add Product
        </button>
      
  );
}