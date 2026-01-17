'use client';
import ProductTable from "@/app/components/tables/producttable";
import { Product } from "@/type/producttype";
import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { EditIconBtn, SubmitBtn, view, ViewIconBtn } from "@/app/components/ui";
import { deleteProduct } from "@/app/functions/admin/stock/product/product";
import { toast } from "sonner";
import DeleteProduct from "./deleteproduct";
import { fetchProducts } from "@/app/functions/admin/api/controller";
import { Package, Trash2, AlertCircle, RefreshCw, Eye } from "lucide-react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

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

  const { data: productData, isLoading, error, refetch } = useQuery({
    queryKey: ["products", refreshKey],
    queryFn: fetchProducts,
  });

  // Process and enhance products when data changes
  useEffect(() => {
    if (!productData) return;

    // Handle different possible data structures
    let productsArray: Product[] = [];
    
    if (Array.isArray(productData)) {
      // If productData is directly an array
      productsArray = productData;
    } else if (productData.product && Array.isArray(productData.product)) {
      // If productData has a 'product' property that's an array
      productsArray = productData.product;
    } else if (productData.products && Array.isArray(productData.products)) {
      // If productData has a 'products' property that's an array
      productsArray = productData.products;
    }

    // Enhance products with category and subcategory names
    const enhancedProducts: EnhancedProduct[] = productsArray.map((product: Product) => ({
      ...product,
    }));

    setDisplayProducts(enhancedProducts);

    // Register search capability with parent component using onDataLoaded
    if (onDataLoaded) {
      const searchKeys: (keyof EnhancedProduct)[] = [
        'product_name',
        'sku_code',
        'category_name',
        'subcategory_name',
        'description'
      ];
      onDataLoaded(enhancedProducts, handleSearchResults, searchKeys);
    }
  }, [productData, onDataLoaded, handleSearchResults]);

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      toast.error('No products selected');
      return;
    }
    
    try {
      const res = await deleteProduct(selectedProducts);
      const result = typeof res === 'string' ? JSON.parse(res) : res;
      
      if (result.error) {
        console.error('Failed to delete products:', result.error);
        toast.error('Failed to delete products');
      } else {
        toast.success(`${selectedProducts.length} product(s) deleted successfully`);
        setSelectedProducts([]);
        // Refetch data instead of hard reload
        refetch();
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Something went wrong while deleting');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <AiOutlineLoading3Quarters className="w-10 h-10 animate-spin text-amber-600 mx-auto mb-3" />
          <p className="text-amber-900 font-semibold uppercase tracking-wide text-sm">
            Loading Products...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="w-16 h-16 bg-amber-100 border-2 border-amber-300 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-amber-600" />
        </div>
        <p className="text-amber-900 font-semibold mb-4 text-lg">Failed to Load Products</p>
        <button 
          onClick={() => refetch()} 
          className="px-6 py-2.5 border-2 border-amber-300 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold transition-colors flex items-center gap-2 uppercase tracking-wide text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  if (displayProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="w-20 h-20 bg-amber-100 border-2 border-amber-300 flex items-center justify-center mb-4">
          <Package className="w-10 h-10 text-amber-600" />
        </div>
        <p className="text-amber-900 font-semibold mb-2 text-lg">No Products Found</p>
        <p className="text-amber-700 mb-6 text-sm">Get started by adding your first product</p>
        <Link 
          href="/admin/products/create"
          className="px-6 py-2.5 border-2 border-amber-300 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold transition-colors uppercase tracking-wide text-sm"
        >
          Add Your First Product
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedProducts.length > 0 && (
        <div className="bg-amber-100 border-2 border-amber-300 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">{selectedProducts.length}</span>
            </div>
            <span className="text-sm font-bold text-amber-900 uppercase tracking-wide">
              {selectedProducts.length} Product{selectedProducts.length > 1 ? 's' : ''} Selected
            </span>
          </div>
          <button
            onClick={handleBulkDelete}
            className="px-4 py-2 border-2 border-red-400 bg-red-100 hover:bg-red-200 text-red-900 font-semibold transition-colors flex items-center gap-2 uppercase tracking-wide text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Delete ({selectedProducts.length})
          </button>
        </div>
      )}
      
      {/* Product Table */}
      <div className="bg-white">
        <ProductTable
          itemsPerPage={8}
          product={displayProducts}
          columns={[
            'select',
            'product_image',
            'sku-code',     
            'product_name',
            'description',
            'category_id',
            'action'
          ]}
          form={(product) => {
            // Ensure product exists before rendering actions
            if (!product) {
              return null;
            }
            
            const p = product as Product;
            return (
              <div className="flex items-center gap-5">
                <Link 
                  href={`/admin/products/components/productdetail/${p.product_id}`}
                  className={ViewIconBtn}
                  title="View Details"
                >
                  <Eye className="w-3.5 h-3.5" />
                </Link>
                <DeleteProduct product={p} />
              </div>
            );
          }}
          onSelectionChange={(selected: any) => {
            console.log("Selected products:", selected);
            setSelectedProducts(selected);
          }}
        />
      </div>

    </div>
  );
}