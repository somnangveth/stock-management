"use client";

import { useState, useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

import { fetchDiscount, fetchPricesB2B, fetchPricesB2C, fetchProducts } from "@/app/functions/admin/api/controller";
import { Price } from "@/type/producttype";
import SingleDiscountForm from "../singlediscountform";
import DiscountMultipleForm from "../discountform";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DiscountDetailPage() {
  const router = useRouter();
  const [selectedDiscounts, setSelectedDiscounts] = useState<Price[]>([]);

  const formatDate = (date?: string | Date) => {
    if (!date) return "-";
    return new Date(date).toISOString().split("T")[0];
  };

  const result = useQueries({
    queries: [
      { queryKey: ["discountQuery"], queryFn: fetchDiscount },
      { queryKey: ["priceb2bQuery"], queryFn: fetchPricesB2B },
      { queryKey: ["priceb2cQuery"], queryFn: fetchPricesB2C },
      { queryKey: ["productQuery"], queryFn: fetchProducts },
    ],
  });

  const [discountRes, b2bRes, b2cRes, productRes] = result;

  const discountPriceList: Price[] = useMemo(() => {
    if (!discountRes.data || !b2bRes.data || !b2cRes.data || !productRes.data) return [];

    return discountRes.data.map((discountItem: any) => {
      const b2b = b2bRes.data.find((p: Price) => p.price_id === discountItem.price_id);
      const b2c = b2cRes.data.find((p: Price) => p.price_id === discountItem.price_id);
      const price = b2b ?? b2c;
      const product = productRes.data.find((prod: any) => prod.product_id === price?.product_id);

      return {
        ...b2b,
        ...b2c,
        ...discountItem,
        product_image: product?.product_image,
        product_name: product?.product_name ?? "Unknown product",
      };
    });
  }, [discountRes.data, b2bRes.data, b2cRes.data, productRes.data]);

  if (result.some((r) => r.isLoading)) return <div>Loading...</div>;
  if (result.some((r) => r.error)) return <div className="text-red-500">Failed to load data</div>;

  const handleSelect = (price: Price, isSelected: boolean) => {
    setSelectedDiscounts((prev) =>
      isSelected ? [...prev, price] : prev.filter((p) => p.price_id !== price.price_id)
    );
  };

  return (
    <>
      <button onClick={() => router.push("/admin/price")} className="flex items-center text-gray-500 gap-2 mb-4">
        <ArrowLeft /> Back to main page
      </button>

      <h2 className="text-lg font-semibold mb-5">Discount Products</h2>

      {/* Bulk Discount Button */}
      {selectedDiscounts.length > 0 && (
        <div className="mb-4">
          <DiscountMultipleForm prices={selectedDiscounts} />
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-calc[100vh-90px]">
        {/* Header */}
        <div className="grid grid-cols-9 px-4 py-3 bg-gray-50 text-sm font-semibold text-gray-600 border-b sticky top-0">
          <span></span> {/* Checkbox column */}
          <span>Product Name</span>
          <span>Start Date</span>
          <span>End Date</span>
          <span className="text-left">Discount Percent</span>
          <span>Discount Price</span>
          <span>Status</span>
          <span className="text-center">Action</span>
        </div>

        {/* Rows */}
        {discountPriceList.length === 0 && (
          <div className="p-6 text-center text-gray-500">No discounts found</div>
        )}

        {discountPriceList.map((p: Price) => {
          const isSelected = selectedDiscounts.some((item) => item.price_id === p.price_id);
          return (
            <div
              key={p.price_id}
              className="grid grid-cols-9 items-center px-4 py-3 text-sm border-b last:border-b-0 hover:bg-gray-50 transition overflow-y-auto overflow-hidden"
            >
              {/* Checkbox */}
              <span className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => handleSelect(p, e.target.checked)}
                  className="w-4 h-4"
                />
              </span>

              {/* Product */}
              <span className="flex items-center gap-2 font-medium text-gray-800">
                <Image
                  src={p.product_image || "/assets/product_default.jpg"}
                  alt={p.product_name || "no image"}
                  width={30}
                  height={30}
                />
                {p.product_name}
              </span>

              {/* Dates */}
              <span className="text-gray-600">{formatDate(p.start_date)}</span>
              <span className="text-gray-600">{formatDate(p.end_date)}</span>

              {/* Price */}
              <span className="font-semibold text-gray-800 text-center">%{p.discount_percent}</span>
              <span className="font-semibold text-gray-800">${p.discount_price}</span>

              {/* Status */}
              <span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                    ${p.discount_status === "active"
                      ? "bg-green-100 text-green-700"
                      : p.discount_status === "expired"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-600"}`}
                >
                  {p.discount_status}
                </span>
              </span>

              {/* Action */}
              <span className="flex justify-center">
                <SingleDiscountForm price={p} />
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
