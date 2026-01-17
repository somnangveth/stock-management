"use client";

import { btnStyle } from "@/app/components/ui";
import { fetchAttribute, fetchProducts, fetchSalePrice } from "@/app/functions/admin/api/controller";
import { useQueries } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export default function AttributePage(){
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");

    const results = useQueries({
        queries: [
            {
                queryKey: ["salepriceQuery"],
                queryFn: fetchSalePrice,
            },
            {
                queryKey: ["productQuery"],
                queryFn: fetchProducts,
            },
            {
                queryKey: ["attributeQuery"],
                queryFn: fetchAttribute,
            }
        ]
    });

    const [salePriceQuery, productQuery, attributeQuery] = results;
    
    const isLoading = results.some(result => result.isLoading);
    const isError = results.some(result => result.isError);

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="text-center py-12">Loading...</div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-6">
                <div className="text-center py-12 text-red-600">Error loading data</div>
            </div>
        );
    }

    const salePrices = salePriceQuery.data || [];
    const products = productQuery.data || [];
    const attributes = attributeQuery.data || [];

    // Group sale prices by product
    const productPricesMap = salePrices.reduce((acc: any, price: any) => {
        if (!acc[price.product_id]) {
            acc[price.product_id] = [];
        }
        acc[price.product_id].push(price);
        return acc;
    }, {});

    // Filter products that have attributes
    const productsWithAttributes = products.filter(
        (product: any) => productPricesMap[product.product_id]?.length > 0
    );

    // Filter products based on search query
    const filteredProducts = productsWithAttributes.filter((product: any) => {
        const searchLower = searchQuery.toLowerCase();
        return (
            product.product_name.toLowerCase().includes(searchLower) ||
            product.sku_code.toLowerCase().includes(searchLower) ||
            (product.description && product.description.toLowerCase().includes(searchLower))
        );
    });

    // Get attribute details by ID
    const getAttributeDetails = (attributeId: any) => {
        return attributes.find((attr:any) => attr.attribute_id === attributeId);
    };

    return(
        <div className="p-6">
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">

                {/* Search Bar */}
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by name, SKU, or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

                <div className="m-2 flex justify-end">
                    <button
                    className={btnStyle}
                    onClick={() => router.push('/admin/attribute/components/createattribute')}>
                    Add New Attribute
                    </button>
                </div>

            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product:any) => {
                    const prices = productPricesMap[product.product_id] || [];
                    
                    // Group prices by module
                    const pricesByModule = prices.reduce((acc:any, price:any) => {
                        const attr = getAttributeDetails(price.attribute_id);
                        if (attr) {
                            if (!acc[attr.module]) {
                                acc[attr.module] = [];
                            }
                            acc[attr.module].push({
                                ...price,
                                attribute_name: attr.attribute_name
                            });
                        }
                        return acc;
                    }, {});

                    return (
                        <div 
                            key={product.product_id} 
                            className="border border-gray-300 overflow-hidden bg-white cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => router.push(`/admin/attribute/components/attributedetail/${product.product_id}`)}>
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-semibold">{product.product_name}</h3>
                                    <span className="text-sm text-gray-500">{product.sku_code}</span>
                                </div>
                                
                                {product.description && (
                                    <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                                )}

                                <div className="space-y-3">
                                    {Object.entries(pricesByModule).map(([module, modulePrices]) => {
                                        const pricesArray = modulePrices as any[];

                                        return (
                                            <div key={module}>
                                                <h4 className="text-sm font-medium text-gray-700 capitalize mb-2">
                                                    {module}
                                                </h4>
                                                <div className="space-y-1">
                                                    {pricesArray.map((price:any) => (
                                                        <div 
                                                            key={price.price_id} 
                                                            className="flex justify-between items-center text-sm bg-gray-50 p-2"
                                                        >
                                                            <span className="text-gray-700 capitalize">
                                                                {price.attribute_name}
                                                                {price.attribute_value > 1 && ` (${price.attribute_value})`}
                                                            </span>
                                                            <span className="font-medium">
                                                                ${price.price_value.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-4 pt-3 border-t border-gray-200">
                                    <div className="flex justify-between text-sm text-gray-500">
                                        <span>Package: {product.package_type}</span>
                                        <span>Units: {product.units_per_package}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredProducts.length === 0 && !searchQuery && (
                <div className="text-center py-12 text-gray-500">
                    No products with attributes found
                </div>
            )}

            {filteredProducts.length === 0 && searchQuery && (
                <div className="text-center py-12 text-gray-500">
                    No products found matching "{searchQuery}"
                </div>
            )}
        </div>
    );
}