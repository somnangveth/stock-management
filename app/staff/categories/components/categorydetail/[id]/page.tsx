"use client";

import { fetchCategoryAndSubcategory, fetchProducts } from "@/app/functions/admin/api/controller";
import { Categories, Product, Subcategories } from "@/type/producttype";
import { useQueries } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import DeleteSubcategoryForm from "../../subcategory/deletesubform";
import UpdateSubForm from "../../subcategory/updatesubform";

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const line = <div className="flex-1 border-b border-gray-300" />;

  const result = useQueries({
    queries: [
      {
        queryKey: ["category-subcategory"],
        queryFn: fetchCategoryAndSubcategory,
      },
      {
        queryKey: ["productQuery"],
        queryFn: fetchProducts,
      },
    ],
  });

  const categorySubcategoryData = result[0].data;
  const productData = result[1].data;

  const isLoading = result[0].isLoading || result[1].isLoading;
  const hasError = result[0].error || result[1].error;

  // 🔹 Category name
  const categoryName = useMemo(() => {
    if (!categorySubcategoryData) return "";

    const category = categorySubcategoryData.categories.find(
      (cat: Categories) => Number(cat.category_id) === Number(id)
    );

    return category?.category_name || "";
  }, [categorySubcategoryData, id]);

  // 🔹 Filter subcategories
  const subcategories = useMemo(() => {
    if (!categorySubcategoryData?.subcategories) return [];

    return categorySubcategoryData.subcategories.filter(
      (sub: Subcategories) => Number(sub.category_id) === Number(id)
    );
  }, [categorySubcategoryData, id]);

  // 🔹 Product count per subcategory
  const productCounts = useMemo(() => {
    if (!productData) return {};

    const counts: Record<number, number> = {};

    productData.forEach((product: Product) => {
      const subId = Number(product.subcategory_id);
      counts[subId] = (counts[subId] || 0) + 1;
    });

    return counts;
  }, [productData]);

  return (
    <div className="p-4">
      {/* Back button */}
      <button
        onClick={() => router.push("/staff/categories/components/categoryinfo")}
        className="flex gap-2 items-center mb-4 hover:text-gray-600"
      >
        <ArrowLeft />
        <span>Back to Categories</span>
      </button>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center items-center gap-2 text-gray-400">
          <p>Loading</p>
          <AiOutlineLoading3Quarters className="animate-spin" />
        </div>
      )}

      {/* Error */}
      {hasError && (
        <div className="text-red-500">
          <p>Error loading data</p>
        </div>
      )}

      {/* Content */}
      {!isLoading && !hasError && (
        <div>
          <h1 className="font-bold text-2xl mb-6">{categoryName}</h1>

          {subcategories.length === 0 ? (
            <p className="text-gray-500">
              No subcategories found for this category.
            </p>
          ) : (
            <div className="grid sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {subcategories.map((sub: Subcategories) => (
                <div
                  key={sub.subcategory_id}
                  onClick={() =>
                    router.push(
                      `/staff/categories/subcategory/${sub.subcategory_id}`
                    )
                  }
                  className="cursor-pointer border rounded-lg hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start p-3">
                    <h2 className="font-semibold text-lg whitespace-nowrap">
                      {sub.subcategory_name}
                    </h2>

                    {/* Prevent navigation when clicking buttons */}
                    <div
                      className="flex gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DeleteSubcategoryForm subcategory={sub} />
                      <UpdateSubForm subcategory={sub} />
                    </div>
                  </div>

                  {line}

                  {/* Product count */}
                  <div className="flex items-center gap-1 whitespace-nowrap p-3">
                    <span className="text-sm text-gray-500">Products:</span>
                    <span className="font-medium">
                      {productCounts[Number(sub.subcategory_id)] || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
