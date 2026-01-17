'use client';
import { useCallback, useState } from "react";
import { Categories } from "@/type/producttype";
import SearchBar from "@/app/components/searchbar";
import AddCategoryForm from "./components/category/addcatform";
import UpdateCategoryForm from "./components/category/updatecatform";
import { useQueries } from "@tanstack/react-query";
import { fetchCategory } from "@/app/functions/admin/stock/category/category";
import { buildCategoryTree, flattenCategoryTree } from "@/type/producttype";
import { FilterPanel } from "./components/category/filterpanel";
import { fetchProducts } from "@/app/functions/admin/api/controller";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { btnStyle, view } from "@/app/components/ui";

interface Product {
  product_id: string;
  sku_code: string;
  product_name: string;
  slug: string;
  product_image: string | null;
  created_at: string;
  updated_at: string;
  units_per_package: number;
  package_type: string;
  description: string;
  created_by: string;
  product_location: string | null;
  category_id: string | null;
}

export default function CategoryPage() {
  const router = useRouter();
  const [visibleCategories, setVisibleCategories] = useState<Categories[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filteredCategoryIds, setFilteredCategoryIds] = useState<string[]>([]);

  // Fetch categories and products
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

  // Build hierarchy for display
  const flatCategories = flattenCategoryTree(buildCategoryTree(categoryData));

  // Apply filter
  const handleApplyFilter = useCallback((selectedIds: string[]) => {
    setFilteredCategoryIds(selectedIds);
    setIsFilterOpen(false);
  }, []);

  // Get categories to display (filtered or all)
  const displayCategories = (() => {
    // If search results exist, use them
    if (visibleCategories.length > 0) {
      return visibleCategories;
    }
    
    // If filter is active, filter categories
    if (filteredCategoryIds.length > 0) {
      return flatCategories.filter((cat) =>
        filteredCategoryIds.includes(String(cat.category_id))
      );
    }
    
    // Otherwise show all
    return flatCategories;
  })();

  // Function to get category name by ID
  const getCategoryName = (categoryId: string | null): string => {
    if (!categoryId) return 'Uncategorized';
    
    const category = categoryData.find((cat: Categories) => String(cat.category_id) === categoryId);
    return category ? category.category_name : 'Unknown Category';
  };

  // Filter products based on selected categories
  const displayProducts = (() => {
    if (filteredCategoryIds.length > 0) {
      return productData.filter((product: Product) =>
        product.category_id && filteredCategoryIds.includes(product.category_id)
      );
    }
    return productData;
  })();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Category Management</h1>
        
        <div className="flex items-center gap-3 w-1/2">
          {/* Filter Button */}
          <button
            onClick={() => setIsFilterOpen(true)}
            className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 flex items-center gap-2 whitespace-nowrap"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filter
            {filteredCategoryIds.length > 0 && (
              <span className="bg-white text-amber-500 rounded-full px-2 py-0.5 text-sm font-semibold">
                {filteredCategoryIds.length}
              </span>
            )}
          </button>

          {/* Clear Filter Button */}
          {filteredCategoryIds.length > 0 && (
            <button
              onClick={() => setFilteredCategoryIds([])}
              className={btnStyle}
            >
              Clear filter
            </button>
          )}

          {/* Search bar for categories */}
          <div className="flex-1">
            <SearchBar
              data={flatCategories}
              onSearch={(results) => setVisibleCategories(results)}
              searchKeys={["category_name"]}
              placeholder="Search categories..."
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <AddCategoryForm />
        <button
        className={btnStyle}
        onClick={() => router.push("/admin/categories/components/viewcategory")}>
          {view} Categories
        </button>
      </div>

      {/* Products Grid */}
      <div className="mt-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Products</h2>
          <div className="text-sm text-gray-500">
            Showing {displayProducts.length} of {productData.length} products
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          </div>
        ) : productData.length === 0 ? (
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
        ) : displayProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium">No products in selected categories</p>
            <p className="text-sm mt-2">Clear the filter to see all products</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {displayProducts.map((product: Product) => (
              <div
                key={product.product_id}
                className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 bg-white"
              >
                {/* Product Image */}
                <div className="relative w-full aspect-[4/3] bg-gray-100">
                  {product.product_image ? (
                    <Image
                      src={product.product_image}
                      alt={product.product_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg
                        className="w-16 h-16"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  {/* Product Name */}
                  <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-2">
                    {product.product_name}
                  </h3>
                  
                  {/* Category Name */}
                  <p className="text-sm text-gray-500">
                    {getCategoryName(product.category_id)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter Panel Modal */}
      {isFilterOpen && (
        <FilterPanel
          categories={flatCategories}
          onApplyFilter={handleApplyFilter}
          onClose={() => setIsFilterOpen(false)}
        />
      )}
    </div>
  );
}