"use client";
import { RetryButton } from "@/app/components/error/error";
import { fetchCategoryAndSubcategory, fetchProducts } from "@/app/functions/admin/api/controller";
import { Categories, Product, Subcategories } from "@/type/producttype";
import { useQueries } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import DeleteCategoryForm from "../category/deletecategory";
import UpdateCategoryForm from "../category/updatecatform";

export default function CategoryInfoPage() {
  // Styling
  const line = <div className="flex-1 border-b border-gray-300"></div>;
  
  const result = useQueries({
    queries: [
      {
        queryKey: ['category-subcategory'],
        queryFn: fetchCategoryAndSubcategory,
      },
      {
        queryKey: ['productQuery'],
        queryFn: fetchProducts,
      }
    ]
  });
  
  const CategorySubcategoryData = result[0].data;
  const productData = result[1].data;
  
  // Calculate subcategories per category
  const subcategoryCounts = useMemo(() => {
    if (!CategorySubcategoryData) return {};
    const counts: Record<number, number> = {};
    CategorySubcategoryData.subcategories.forEach((sub: Subcategories) => {
      counts[Number(sub.category_id)] = (counts[Number(sub.category_id)] || 0) + 1;
    });
    return counts;
  }, [CategorySubcategoryData]);
  
  // Calculate the products per category
  const productCounts = useMemo(() => {
    if (!productData) return {};
    const counts: Record<number, number> = {};
    
    productData.forEach((product: Product) => {
      counts[Number(product.category_id)] = (counts[Number(product.category_id)] || 0) + 1;
    });
    
    return counts;
  }, [productData]);
  
  const router = useRouter();
  const isLoading = result[0].isLoading || result[1].isLoading;
  const hasError = result[0].error || result[1].error;
  
  if (hasError) return <RetryButton />;
  
  return (
    <div>
      {isLoading && (
        <AiOutlineLoading3Quarters className="animate-spin" />
      )}

      {!isLoading && !hasError && (
        <>
        <button
        onClick={() => router.push('/admin/categories')}
        className="flex items-center gap-2">
          <ArrowLeft/> Back to Main Page
        </button>
        <div className="p-5 overflow-y-auto">
        {CategorySubcategoryData?.categories.map((cat: Categories) => (
        <div
          key={cat.category_id} 
          className="flex flex-col w-full border border-gray-300 m-4 rounded-lg"
        >
          <div className="flex gap-3 p-3 justify-between">
           <div className="flex items-center gap-3">
             <p className="flex items-center border bg-yellow-200 rounded-full px-2">{cat.category_id}</p>
            <h1 className="font-bold text-xl">{cat.category_name}</h1>
           </div>

           <div className="flex items-end">
            <DeleteCategoryForm category={cat}/>
            <UpdateCategoryForm category={cat}/>
           </div>
          </div>
          {line}
          <div className="flex items-center justify-between p-3">
            <div className="flex gap-4">
              <span>Subcategories: {subcategoryCounts[Number(cat.category_id)] || 0}</span>
              <span>Products: {productCounts[Number(cat.category_id)] || 0}</span>
            </div>
            <button
              onClick={() => router.push(`/admin/categories/components/categorydetail/${cat.category_id}`)}
            >
              <ArrowRight />
            </button>
          </div>
        </div>
      ))}
        </div>
        </>
      )}
    </div>
  );
}