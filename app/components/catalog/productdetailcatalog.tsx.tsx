"use client";

import {
  Attribute,
  Categories,
  Price,
  Product,
  Vendors,
} from "@/type/producttype";
import Barcode from "react-barcode";
import Image from "next/image";
import UpdateForm from "@/app/admin/products/components/product/updateform";
import UpdateAttributeForm from "@/app/admin/products/components/attribute/updateattributeform";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import DeleteProduct from "@/app/admin/products/components/product/deleteproduct";
import { edit, EditIconBtn } from "../ui";
import UpdateProductBasicInfo from "@/app/admin/products/components/product/updateproduct";
import UpdateBasicForm from "@/app/admin/products/components/product/updatebasicform";

type ProductAttribute = {
  attribute_id: string;
  attribute_name: string;
  module: string;
  value: number;
  price_value: number;
};

type Props = {
  product: Product;
  attribute: ProductAttribute[];
  categories: Categories[];
  vendors: Vendors[];
  category: Categories;
  role?: "admin" | "staff"; // Add role prop
};

export default function ProductDetailCatalog({
  product,
  attribute,
  categories,
  vendors,
  category,
  role = "admin", // Default to admin if not provided
}: Props) {
  const createdAt = new Date(product.created_at)
    .toISOString()
    .split("T")[0];

  const router = useRouter();

  // Determine base path based on role
  const basePath = role === "admin" ? "/admin" : "/staff";

  return (
    <>
    <div className="w-full h-[calc(100vh-80px)] flex flex-col lg:flex-row gap-6">
      {/* Left Panel */}
      <div className="lg:w-1/3 xl:w-1/4">
      <button
    className="flex items-center gap-2 text-sm text-gray-500"
    onClick={() => router.back()}>
      <ArrowLeft/>
      Back
    </button>
        <div className="sticky top-6 bg-white rounded-lg shadow-sm p-4">
          
          <div className="bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
            <Image
              src={product.product_image || "/assets/product_default.jpg"}
              alt={product.product_name}
              width={300}
              height={300}
              className="object-contain"
            />
          </div>

          <div className="mt-4 flex justify-center">
            <Barcode
              value={String(product.product_id)}
              width={1}
              height={40}
              fontSize={12}
            />
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 bg-white rounded-lg shadow-sm p-6 xl:overflow-y-auto space-y-8">
        {/* Basic Info */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">
            Basic Information
          </h2>
            <UpdateBasicForm
            product={product}
            categories={categories}
            vendors={vendors}
          />

          <InfoRow label="Product Name" value={product.product_name} />
          <InfoRow label="SKU Code" value={product.sku_code} />
          <InfoRow label="Package Type" value={product.package_type} />
          <InfoRow label="Description" value={product.description} />
          <InfoRow label="Created At" value={createdAt} />
        </section>
        

        <section className="space-y-2">
  <h2 className="text-lg font-semibold border-b">Vendors</h2>

  {vendors.length > 0 ? (
    vendors.map((v) => (
      <InfoRow
        key={v.vendor_id}
        label="Vendor"
        value={v.vendor_name}
      />
    ))
  ) : (
    <p className="text-sm text-gray-500">No vendors linked</p>
  )}
</section>

        {/* Attributes */}
<section className="space-y-2">
  <h2 className="flex justify-between items-center text-lg font-semibold border-b">
    Attributes 
    <button
    onClick={()=> router.push(`${basePath}/attribute/components/attributedetail/${product.product_id}`)}>
      {edit}
    </button>
    </h2>

  {attribute.length > 0 ? (
    attribute.map((a) => (
      <InfoRow
        key={a.attribute_id}
        label={`${a.attribute_name} (${a.module})`}
        value={`Value: ${a.value} | Price: $${a.price_value}`}
      />
    ))
  ) : (
    <p className="text-sm text-gray-500">No attributes available</p>
  )}
</section>

      </div>
    </div>
    </>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="grid grid-cols-3 gap-4 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="col-span-2 font-medium">
        {value || "-"}
      </span>
    </div>
  );
}