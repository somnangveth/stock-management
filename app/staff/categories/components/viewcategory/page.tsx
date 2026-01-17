'use client';
import { useCallback, useState } from "react";
import { Categories } from "@/type/producttype";
import SearchBar from "@/app/components/searchbar";
import AddCategoryForm from "../category/addcatform";
import UpdateCategoryForm from "../category/updatecatform";
import { useQuery } from "@tanstack/react-query";
import { fetchCategory } from "@/app/functions/admin/stock/category/category";
import { buildCategoryTree, flattenCategoryTree } from "@/type/producttype";
import { FilterPanel } from "../category/filterpanel";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function CategoryPage() {
    const router = useRouter();
  const [visibleCategories, setVisibleCategories] = useState<Categories[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filteredCategoryIds, setFilteredCategoryIds] = useState<string[]>([]);

  // Fetch categories
  const { data: categoryData = [], isLoading, refetch } = useQuery({
    queryKey: ["categoryQuery"],
    queryFn: fetchCategory
  });

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

  return (
    <div className="p-6">
        <button
        onClick={()=>router.push("/admin/categories")}
        className="flex items-center gap-3">
            <ArrowLeft/> Back
        </button>
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
              className="px-3 py-2 text-gray-600 hover:text-gray-800 underline"
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

      <div className="mb-6">
        <AddCategoryForm />
      </div>

      {/* Category List */}
      <div className="mt-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">All Categories</h2>
          <div className="text-sm text-gray-500">
            Showing {displayCategories.length} of {flatCategories.length} categories
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">Loading categories...</div>
        ) : flatCategories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No categories found. Add your first category above.
          </div>
        ) : displayCategories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No categories match your current filter or search.
          </div>
        ) : (
          <div className="border rounded-lg">
            {displayCategories.map((cat) => (
              <div
                key={cat.category_id}
                className="border-b last:border-b-0 p-4 hover:bg-gray-50 flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center">
                    <span className="font-medium">{cat.category_name}</span>
                  </div>
                  {cat.path && (
                    <div className="text-xs text-gray-400">
                      Path: {cat.path}
                    </div>
                  )}
                </div>
                <UpdateCategoryForm category={cat} />
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