'use client';
import Image from 'next/image';
import { Categories } from "@/type/producttype";

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

interface ProductCardProps {
  product: Product;
  categories: Categories[];
}

export default function ProductCard({ product, categories }: ProductCardProps) {
  // Find the category name for this product
  const getCategoryName = (categoryId: string | null): string => {
    if (!categoryId) return 'Uncategorized';
    
    const category = categories.find(cat => String(cat.category_id) === categoryId);
    return category ? category.category_name : 'Unknown Category';
  };

  const categoryName = getCategoryName(product.category_id);

  return (
    <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 bg-white">
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
          {categoryName}
        </p>
      </div>
    </div>
  );
}