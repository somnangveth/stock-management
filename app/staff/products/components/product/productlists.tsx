'use client';
import ProductTable from "@/app/components/tables/producttable";
import { Product } from "@/type/producttype";
import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { EditIconBtn, SubmitBtn, view } from "@/app/components/ui";
import { deleteProduct} from "@/app/functions/admin/stock/product/product";
import { fetchCategoryAndSubcategory } from "@/app/functions/admin/api/controller";
import { toast } from "sonner";
import DeleteProduct from "./deleteproduct";

// Define enhanced product type
export interface EnhancedProduct extends Product {
  category_name?: string;
  subcategory_name?: string;
}

export default function ProductList({ 
  refreshKey = 0,
  onDataLoaded
}: { 
  refreshKey?: number;
  onDataLoaded?: (
    data: EnhancedProduct[], 
    onSearch: (results: EnhancedProduct[]) => void,
    searchKeys: (keyof EnhancedProduct)[]
  ) => void;
}) {
  const [displayProducts, setDisplayProducts] = useState<EnhancedProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  // Memoized search handler
  const handleSearchResults = useCallback((results: EnhancedProduct[]) => {
    setDisplayProducts(results);
  }, []);

  const { data: productData, isLoading, error } = useQuery({
    queryKey: ["products", refreshKey],
    queryFn: fetchCategoryAndSubcategory,
  });

  // Process and enhance products when data changes
  useEffect(() => {
    if (!productData) return;

    // Create lookup maps for quick access
    const categoryMap = new Map(
      productData.categories.map((cat: { category_id: string; category_name: string; }) => 
        [cat.category_id, cat.category_name]
      )
    );
    
    const subcategoryMap = new Map(
      productData.subcategories.map((sub: { subcategory_id: string; subcategory_name: string; }) => 
        [sub.subcategory_id, sub.subcategory_name]
      )
    );

    // Enhance products with category and subcategory names
    const enhancedProducts: EnhancedProduct[] = productData.product.map((product: Product) => ({
      ...product,
      category_name: categoryMap.get(product.category_id) || 'Unknown',
      subcategory_name: subcategoryMap.get(product.subcategory_id) || 'Unknown'
    }));

    setDisplayProducts(enhancedProducts);

    // Notify parent component if callback provided
    if (onDataLoaded) {
      const searchKeys: (keyof EnhancedProduct)[] = [
        'product_name',
        'sku_code',
        'category_name',
        'subcategory_name'
      ];
      onDataLoaded(enhancedProducts, handleSearchResults, searchKeys);
    }
  }, [productData, onDataLoaded, handleSearchResults]);

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    
    try {
      const res = await deleteProduct(selectedProducts);
      const result = JSON.parse(res);
      
      if (result.error) {
        console.error('Failed to delete products:', result.error);
        toast.error('Failed to delete products');
      } else {
        toast.success(`${selectedProducts.length} product(s) deleted successfully`);
        setSelectedProducts([]);
        // Trigger a refetch by incrementing refreshKey or reload
        window.location.reload();
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Something went wrong while deleting');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-red-500">Failed to load products</p>
        <button 
          onClick={() => window.location.reload()} 
          className="ml-4 text-blue-600 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (displayProducts.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">No products found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {selectedProducts.length > 0 && (
        <div className="mb-4 p-3 rounded-lg flex items-center justify-between">
          <button
            onClick={handleBulkDelete}
            className={SubmitBtn}
          >
            Delete Selected
          </button>
        </div>
      )}
      
      <ProductTable
        itemsPerPage={9}
        product={displayProducts}
        columns={[
          'select',
          'product_image',
          'sku-code',     
          'product_name',
          'category_id',
          'description',
          'action'
        ]}
        form={(product) => {
          // Ensure product exists before rendering actions
          if (!product) {
            return null;
          }
          
          const p = product as Product;
          return (
            <div className="flex items-center gap-2">
              <Link 
              className={EditIconBtn}
              href={`/staff/products/components/productdetail/${p.product_id}`}>
                {view}
              </Link>
               <DeleteProduct product={productData}/>
            </div>
          );
        }}
        onSelectionChange={(selected: any) => {
          console.log("Selected products:", selected);
          setSelectedProducts(selected);
        }}
      />
    </div>
  );
}