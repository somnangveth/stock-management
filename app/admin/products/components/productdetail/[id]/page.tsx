"use client";

import ProductDetailCatalog from "@/app/components/catalog/productdetailcatalog.tsx";
import {
  fetchAttribute,
  fetchCategory,
  fetchImportPrice,
  fetchProducts,
  fetchProductVendor,
  fetchVendors,
} from "@/app/functions/admin/api/controller";

import { cn } from "@/lib/utils";
import {
  Attribute,
  Categories,
  Price,
  Product,
  Vendors,
} from "@/type/producttype";

import { useQueries } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

type ProductVendor = {
  product_vendor_id: string;
  product_id: string;
  vendor_id: number;
};

type ProductAttribute = {
  attribute_id: string;
  attribute_name: string;
  module: string;
  value: number;
  price_value: number;
};

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();

  const result = useQueries({
    queries: [
      { queryKey: ["products"], queryFn: fetchProducts },
      { queryKey: ["product-vendors"], queryFn: fetchProductVendor },
      { queryKey: ["vendors"], queryFn: fetchVendors },
      { queryKey: ["categories"], queryFn: fetchCategory },
      { queryKey: ["prices"], queryFn: fetchImportPrice },
      { queryKey: ["attributes"], queryFn: fetchAttribute },
    ],
  });

  const [
    productQuery,
    productVendorQuery,
    vendorQuery,
    categoryQuery,
    priceQuery,
    attributeQuery,
  ] = result;

  const isLoading = result.some((q) => q.isLoading);
  const hasError = result.some((q) => q.error);

  const products = productQuery.data ?? [];
  const productVendors: ProductVendor[] = productVendorQuery.data ?? [];
  const vendors: Vendors[] = vendorQuery.data ?? [];
  const categories: Categories[] = categoryQuery.data ?? [];
  const prices: Price[] = priceQuery.data ?? [];
  const attributes: Attribute[] = attributeQuery.data ?? [];

  /** ✅ PRODUCT */
  const product = useMemo(() => {
    return products.find((p: Product) => p.product_id === id);
  }, [products, id]);

  /** ✅ CATEGORY */
  const category = useMemo(() => {
    if (!product || !product.category_id) return null;
    return categories.find(
      (c) => c.category_id === product.category_id
    );
  }, [categories, product]);

  /** ✅ PRODUCT → VENDORS (MANY-TO-MANY) */
  const productVendorList = useMemo(() => {
    if (!product) return [];
    return productVendors.filter(
      (pv) => pv.product_id === product.product_id
    );
  }, [product, productVendors]);

  const productVendorsResolved = useMemo(() => {
    if (!productVendorList.length) return [];
    return vendors.filter((v) =>
      productVendorList.some(
        (pv:any) => pv.vendor_id === v.vendor_id
      )
    );
  }, [vendors, productVendorList]);

  /** ✅ ATTRIBUTES (via price table) */
  const productAttributes = useMemo(() => {
    if (!product) return [];

    return prices
      .filter((p) => p.product_id === product.product_id)
      .map((price) => {
        const attr = attributes.find(
          (a) => a.attribute_id === price.attribute_id
        );
        if (!attr) return null;

        return {
          attribute_id: attr.attribute_id,
          attribute_name: attr.attribute_name,
          module: attr.module,
          value: Number(price.attribute_value),
          price_value: price.price_value,
        };
      })
      .filter((item): item is ProductAttribute => item !== null);
  }, [product, prices, attributes]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Loading
        <AiOutlineLoading3Quarters className={cn("animate-spin ml-2")} />
      </div>
    );
  }

  if (hasError || !product || !category) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Failed to load product
      </div>
    );
  }

  return (
    <ProductDetailCatalog
      product={product}
      vendors={productVendorsResolved}
      categories={categories}
      attribute={productAttributes}
      category={category}
      role="admin"
    />
  );
}