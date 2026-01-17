'use client';
import { useQueries } from "@tanstack/react-query";
import { fetchCategory } from "@/app/functions/admin/stock/category/category";
import { fetchProducts } from "@/app/functions/admin/api/controller";
import ProductCard from "./productcard";

export default function ProductGrid() {
  // Fetch both categories and products
  const results = useQueries({
    queries: [
      {
        queryKey: ["categoryQuery"],
        queryFn: fetchCategory
      },
      {
        queryKey: ["productQuery"],
        queryFn: fetchProducts
      }
    ]
  });

  const categoryData = results[0].data || [];
  const productData = results[1].data || [];
  const isLoading = results[0].isLoading || results[1].isLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (productData.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg
          className="w-16 h-16 mx-auto mb-4 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <p className="text-lg font-medium">No products available</p>
        <p className="text-sm mt-2">Add your first product to get started</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Products</h2>
        <p className="text-gray-600 mt-1">
          Showing {productData.length} {productData.length === 1 ? 'product' : 'products'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {productData.map((product:any) => (
          <ProductCard
            key={product.product_id}
            product={product}
            categories={categoryData}
          />
        ))}
      </div>
    </div>
  );
}