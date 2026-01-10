"use client";

import ProductDetailCatalog from "@/app/components/catalog/productdetailcatalog.tsx";
import {
  fetchAttribute,
  fetchCategoryAndSubcategory,
  fetchPricesB2B,
  fetchPricesB2C,
  fetchProductAttribute,
  fetchProducts,
  fetchVendors,
} from "@/app/functions/admin/api/controller";

import {
  Attribute,
  Categories,
  Price,
  Product,
  Subcategories,
  Vendors,
} from "@/type/producttype";

import { useQueries } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id;

  /* -------------------- FETCH ALL DATA -------------------- */
  const result = useQueries({
    queries: [
      { queryKey: ["category-subcategory"], queryFn: fetchCategoryAndSubcategory },
      { queryKey: ["products"], queryFn: fetchProducts },
      { queryKey: ["vendors"], queryFn: fetchVendors },
      { queryKey: ["price-b2c"], queryFn: fetchPricesB2C },
      { queryKey: ["price-b2b"], queryFn: fetchPricesB2B },
      { queryKey: ["product-attribute"], queryFn: fetchProductAttribute },
      { queryKey: ["attribute"], queryFn: fetchAttribute },
    ],
  });

  const [
    categorySubcategoryQuery,
    productQuery,
    vendorQuery,
    priceB2CQuery,
    priceB2BQuery,
    productAttributeQuery,
    attributeQuery,
  ] = result;

  const isLoading = result.some((q) => q.isLoading);
  const hasError = result.some((q) => q.isError);

  // products
  const product = useMemo<Product | null>(() => {
    if (!productQuery.data) return null;
    return productQuery.data.find(
      (p: Product) => String(p.product_id) === String(id)
    );
  }, [productQuery.data, id]);

  // Prices
  const prices = useMemo<Partial<Price>>(() => {
    if (!product) return {};

    const b2c = priceB2CQuery.data?.find(
      (p: Price) => p.product_id === product.product_id
    );

    const b2b = priceB2BQuery.data?.find(
      (p: Price) => p.product_id === product.product_id
    );

    return {
      base_price: b2c?.base_price,
      profit_price: b2c?.profit_price,
      tax: b2c?.tax,
      shipping: b2c?.shipping,
      total_amount: b2c?.total_amount,
      b2b_price: b2b?.b2b_price,
    };
  }, [product, priceB2CQuery.data, priceB2BQuery.data]);

  // Display datas
  const category = useMemo<Categories | null>(() => {
    if (!product || !categorySubcategoryQuery.data) return null;
    return categorySubcategoryQuery.data.categories.find(
      (c: Categories) => Number(c.category_id) === product.category_id
    );
  }, [product, categorySubcategoryQuery.data]);

  const subcategory = useMemo<Subcategories | null>(() => {
    if (!product || !categorySubcategoryQuery.data) return null;
    return categorySubcategoryQuery.data.subcategories.find(
      (s: Subcategories) => Number(s.subcategory_id) === product.subcategory_id
    );
  }, [product, categorySubcategoryQuery.data]);

  const vendor = useMemo<Vendors | null>(() => {
    if (!product || !vendorQuery.data) return null;
    return vendorQuery.data.find(
      (v: Vendors) => Number(v.vendor_id) === product.vendor_id
    );
  }, [product, vendorQuery.data]);


  const categories = categorySubcategoryQuery.data?.categories ?? [];
  const subcategories = categorySubcategoryQuery.data?.subcategories ?? [];
  const vendors = vendorQuery.data ?? [];

  const attributes = useMemo<Attribute[]>(() => {
    if (!product || !productAttributeQuery.data || !attributeQuery.data) {
      return [];
    }

    const productAttributes = productAttributeQuery.data.filter(
      (pa: any) => pa.product_id === product.product_id
    );

    return productAttributes.map((pa: any) => {
      const attribute = attributeQuery.data.find(
        (a: Attribute) => a.attribute_id === pa.attribute_id
      );

      return {
        product_attribute_id: pa.product_attribute_id, // ← FIXED: Include this!
        attribute_id: pa.attribute_id,
        attribute_name: attribute?.attribute_name ?? "Unknown",
        value: pa.value,
      };
    });
  }, [product, productAttributeQuery.data, attributeQuery.data]);

  console.log("Attributes with product_attribute_id:", attributes); // Debug log

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Loading <AiOutlineLoading3Quarters className="ml-2 animate-spin" />
      </div>
    );
  }

  if (hasError || !product || !category || !subcategory || !vendor) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Product not found
      </div>
    );
  }

  return (
    <ProductDetailCatalog
      product={product}
      price={prices as Price}
      attribute={attributes}

      /* filtered (display) */
      category={category}
      subcategory={subcategory}
      vendor={vendor}

      /* full lists (forms) */
      categories={categories}
      subcategories={subcategories}
      vendors={vendors}
    />
  );
}