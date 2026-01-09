"use client";

import {
  Attribute,
  Categories,
  Price,
  Product,
  Subcategories,
  Vendors,
} from "@/type/producttype";
import Barcode from "react-barcode";
import Image from "next/image";
import UpdatePriceFormB2B from "@/app/admin/price/components/b2b/updatepriceformb2b";
import UpdatePriceFormB2C from "@/app/admin/price/components/b2c/updateform";
import UpdateForm from "@/app/admin/products/components/product/updateform";
import UpdateAttributeForm from "@/app/admin/products/components/attribute/updateattributeform";

type Props = {
  product: Product;
  price: Price;
  attribute: Attribute[];


  categories: Categories[];
  subcategories: Subcategories[];
  vendors: Vendors[];

  category: Categories;
  subcategory: Subcategories;
  vendor: Vendors;
};

export default function ProductDetailCatalog({
  product,
  price,
  attribute,

  categories,
  subcategories,
  vendors,

  category,
  subcategory,
  vendor,
}: Props) {
  const createdAt = new Date(product.created_at)
    .toISOString()
    .split("T")[0];

  return (
    <div className="w-full h-[calc(100vh-80px)] flex flex-col lg:flex-row gap-6">
      {/* Left Panel */}
      <div className="lg:w-1/3 xl:w-1/4">
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

          <UpdateForm
            product={product}
            categories={categories}
            subcategories={subcategories}
            vendors={vendors}
          />

          <InfoRow label="Product Name" value={product.product_name} />
          <InfoRow label="SKU Code" value={product.sku_code} />
          <InfoRow label="Category" value={category.category_name} />
          <InfoRow label="Subcategory" value={subcategory.subcategory_name} />
          <InfoRow label="Vendor" value={vendor.vendor_name} />
          <InfoRow label="Package Type" value={product.package_type} />
          <InfoRow label="Description" value={product.description} />
          <InfoRow label="Created At" value={createdAt} />
        </section>

        {/* Attributes */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold border-b">
            Attributes
          </h2>

          <UpdateAttributeForm attributes={attribute}/>
          {attribute.length > 0 ? (
            attribute.map((a) => (
              <InfoRow
                key={a.attribute_id}
                label={a.attribute_name}
                value={a.value}
              />
            ))
          ) : (
            <p className="text-sm text-gray-500">No attributes available</p>
          )}
        </section>

        {/* Price */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">
            Price Information
          </h2>

          {price.total_amount && (
            <>
              <p className="font-semibold">General Customer</p>
              <UpdatePriceFormB2C priceData={price} />
              <InfoRow label="Sale Price" value={String(price.total_amount)} />
            </>
          )}

          {price.b2b_price && (
            <>
              <p className="font-semibold">Dealer</p>
              <UpdatePriceFormB2B priceData={price} />
              <InfoRow label="Sale Price" value={String(price.b2b_price)} />
            </>
          )}
        </section>
      </div>
    </div>
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
