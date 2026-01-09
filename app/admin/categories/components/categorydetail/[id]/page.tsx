"use client";
import { fetchCategoryAndSubcategory, fetchProducts } from "@/app/functions/admin/api/controller";
import { Categories, Product, Subcategories } from "@/type/producttype";
import { useQueries } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import DeleteSubcategoryForm from "../../subcategory/deletesubform";
import UpdateSubForm from "../../subcategory/updatesubform";

export default function CategoryDetailPage() {
  const param = useParams();
  const id = param.id as string;
  
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
  
  const categoryName = useMemo(() => {
    if (!CategorySubcategoryData) return "";
    
    const category = CategorySubcategoryData.categories.find((cat: Categories) => 
      cat.category_id === id || Number(cat.category_id) === Number(id)
    );
    
    return category?.category_name || "";
  }, [CategorySubcategoryData, id]);
  
  // Filter Subcategories by a specific Category
  const subcategories = useMemo(() => {
    if (!CategorySubcategoryData?.subcategories) return [];
    
    return CategorySubcategoryData.subcategories.filter((sub: Subcategories) => 
      sub.category_id === id || Number(sub.category_id) === Number(id)
    );
  }, [CategorySubcategoryData, id]);
  
  // Calculate the products per subcategory
  const productCounts = useMemo(() => {
    if (!productData) return {};
    
    const counts: Record<number, number> = {};
    productData.forEach((product: Product) => {
      const subId = Number(product.subcategory_id);
      counts[subId] = (counts[subId] || 0) + 1;
    });
    
    return counts;
  }, [productData]);
  
  const isLoading = result[0].isLoading || result[1].isLoading;
  const hasError = result[0].error || result[1].error;
  const router = useRouter();
  
  return (
    <div className="p-4">
      <button
        onClick={() => router.push('/admin/categories/components/categoryInfo')}
        className="flex gap-2 items-center mb-4 hover:text-gray-600"
      >
        <ArrowLeft />
        <span>Back to Categories</span>
      </button>
      
      {isLoading && (
        <div className="flex justify-center items-center gap-2 text-gray-400">
          <p>Loading</p>
          <AiOutlineLoading3Quarters className="animate-spin" />
        </div>
      )}
      
      {hasError && (
        <div className="text-red-500">
          <p>Error loading data</p>
        </div>
      )}
      
      {!isLoading && !hasError && (
        <div>
          <h1 className="font-bold text-2xl mb-6">{categoryName}</h1>
          
          {subcategories.length === 0 ? (
            <p className="text-gray-500">No subcategories found for this category.</p>
          ) : (
            <div className="grid sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {subcategories.map((sub: Subcategories) => (
                <div 
                key={sub.subcategory_id} 
                className="items-center gap-3 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex justify-between">
                    <h2 className="font-semibold text-lg whitespace-nowrap p-3">{sub.subcategory_name}</h2>

                    <div className="flex items-end">
                      <DeleteSubcategoryForm subcategory={sub}/>
                      <UpdateSubForm subcategory={sub}/>
                    </div>
                  </div>
                  {line}
                  <div className="flex items-center gap-1 whitespace-nowrap p-3">
                    <span className="text-sm text-gray-500">Products:</span>
                    <span className="font-medium">{productCounts[Number(sub.subcategory_id)] || 0}</span>
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