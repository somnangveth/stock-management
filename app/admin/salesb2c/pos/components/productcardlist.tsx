"use client";
import { IsLoading, RetryButton } from "@/app/components/error/error";
import { ProductCard } from "@/app/components/pos/productcard";
import { 
    fetchAttribute,
    fetchProducts, 
    fetchSalePrice, 
    fetchStockAlert
} from "@/app/functions/admin/api/controller";
import { Product, StockAlert} from "@/type/producttype";
import { useQueries } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import ReceiptPanel from "./receiptpanel";
import { styledToast } from "@/app/components/toast";
import SearchBar from "@/app/components/searchbar";

type CartItem = {
    product: Product;
    quantity: number;
    totalPrice: number;
}

type SalePrice = {
    price_id: string;
    price_value: number;
    product_id: string;
    attribute_id: string;
    price_variance: number;
    attribute_value: string | null;
}

export default function ProductCardList(){
    //---Hook---
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [isSearchActive, setIsSearchActive] = useState(false);

    //Fetch datas
    const result = useQueries({
        queries: [
            {
                queryKey: ["productQuery"],
                queryFn: fetchProducts,
            },
            {
                queryKey: ["stockAlertQuery"],
                queryFn: fetchStockAlert,
            },
            {
                queryKey: ["attributeQuery"],
                queryFn: fetchAttribute
            },
            {
                queryKey: ["salePriceQuery"],
                queryFn: fetchSalePrice,
            }
        ]
    });

    const productQueryResult = result[0].data;
    const stockAlertQueryData = result[1].data;
    const attributeQueryData = result[2].data;
    const salePriceQueryData = result[3].data;

    const isLoading = result[0].isLoading || result[1].isLoading || result[2].isLoading || result[3].isLoading;
    const hasError = result[0].error || result[1].error || result[2].error || result[3].error;

    //Extract product data
    const productData = useMemo(() => {
        if(!productQueryResult) return null;
        return productQueryResult.product || productQueryResult;
    }, [productQueryResult]);

    //Create a map of stock alerts by product_id for easy lookup
    const stockAlertMap = useMemo(() => {
        if(!stockAlertQueryData?.length) return new Map();
        const map = new Map<string, StockAlert>();
        stockAlertQueryData.forEach((alert: StockAlert) => {
            map.set(alert.product_id, alert);
        });
        return map;
    }, [stockAlertQueryData]);

    // Create a map of sale prices by product_id AND attribute_id for easy lookup
    const salePriceMap = useMemo(() => {
        if(!salePriceQueryData?.length) return new Map();
        const map = new Map<string, SalePrice>();
        salePriceQueryData.forEach((price: SalePrice) => {
            // Create a composite key: product_id + attribute_id
            const key = `${price.product_id}-${price.attribute_id}`;
            map.set(key, price);
        });
        return map;
    }, [salePriceQueryData]);

    // Merge products with their sale prices (showing only "small" variant price for display)
    const productsWithPrices = useMemo(() => {
        if(!productData) return [];
        
        return productData.map((product: Product) => {
            const stockAlert = stockAlertMap.get(product.product_id);
            
            // Initialize price - default to 0 if no price found
            let productPrice = 0;
            
            // Find the "small" attribute price for this product
            if(salePriceQueryData && salePriceQueryData.length > 0) {
                // Find all prices for this product
                const productPrices = salePriceQueryData.filter((price: any) => 
                    String(price.product_id) === String(product.product_id)
                );
                
                // Find the small attribute from the product's prices
                if(productPrices.length > 0 && attributeQueryData) {
                    // Get the attribute_id for "small"
                    const smallAttributeId = attributeQueryData.find((attr: any) => 
                        attr.attribute_name?.toLowerCase() === 'small'
                    )?.attribute_id;
                    
                    if(smallAttributeId) {
                        // Find price for small variant
                        const smallPrice = productPrices.find((price: any) => 
                            String(price.attribute_id) === String(smallAttributeId)
                        );
                        
                        if(smallPrice) {
                            productPrice = smallPrice.price_value;
                        }
                    }
                    
                    // Fallback: If no small variant found, use the first available price
                    if(productPrice === 0 && productPrices.length > 0) {
                        productPrice = productPrices[0].price_value;
                    }
                }
            }
            
            return {
                ...product,
                total_price: productPrice,
                price_value: productPrice,
                current_quantity: stockAlert?.current_quantity,
            };
        });
    }, [productData, attributeQueryData, salePriceQueryData, stockAlertMap]);

    //Filter products based on selected category and subcategory
    const filteredProducts = useMemo(() => {
        if(!productsWithPrices || !Array.isArray(productsWithPrices)) return [];
        
        // If search is active, use search results
        if(isSearchActive && searchResults.length >= 0) {
            return searchResults;
        }

        let filtered = productsWithPrices;

        if(selectedCategory){
            filtered = filtered.filter((product: Product) => 
                product.category_id === Number(selectedCategory) || 
                String(product.category_id) === selectedCategory
            );
        }

        if(selectedSubcategory){
            filtered = filtered.filter((product: Product) =>
                product.subcategory_id === Number(selectedSubcategory) || 
                String(product.subcategory_id) === selectedSubcategory
            );
        }

        return filtered;
    }, [productsWithPrices, selectedCategory, selectedSubcategory, searchResults, isSearchActive]);

    //Add product to cart
    const handleAddToCart = (product: Product) => {
        const stockAlert = stockAlertMap.get(String(product.product_id));

        setCart(prevCart => {
            const existingItemIndex = prevCart.findIndex(
                item => String(item.product.product_id) === String(product.product_id)
            );

            const priceToUse = product.total_price || 0; 
            const newQuantity = existingItemIndex > -1 ? prevCart[existingItemIndex].quantity + 1 : 1;

            //Check stock before adding
            if(stockAlert && newQuantity > stockAlert.current_quantity){
                styledToast.error("Insufficient stock available");
                return prevCart;
            }

            if(existingItemIndex > -1){
                //Product exists, increase the quantity
                const updatedCart = [...prevCart];
                updatedCart[existingItemIndex].quantity += 1;
                updatedCart[existingItemIndex].totalPrice = updatedCart[existingItemIndex].quantity * priceToUse;
                return updatedCart;
            }else{
                return [...prevCart, {
                    product,
                    quantity: 1,
                    totalPrice: priceToUse,
                }]
            }
        })
    };

    //Update cart item quantity
    const handleUpdateQuantity = (productId: number | string, newQuantity: number) => {
        if(newQuantity <= 0){
            //Remove item from cart
            setCart(prevCart => 
                prevCart.filter(item => 
                    String(item.product.product_id) !== String(productId)
                )
            );
        }else{
            //Get stock alert for this specific product
            const stockAlert = stockAlertMap.get(String(productId));

            if(stockAlert && newQuantity > stockAlert.current_quantity){
                styledToast.error("Insufficient amount");
                return;
            }

            //Update quantity
            setCart(prevCart => 
                prevCart.map(item => {
                    if(String(item.product.product_id) === String(productId)){
                        const priceToUse = item.product.total_price || 0;
                        return {
                            ...item,
                            quantity: newQuantity,
                            totalPrice: newQuantity * priceToUse
                        };
                    }
                    return item;
                })
            );
        }
    }

    //Clear Cart
    const handleClearCart = () => {
        setCart([]);
    }

    //Calculate subtotal
    const cartSubtotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.totalPrice, 0);
    }, [cart]);

    //Calculate Final Total (no discount calculation)
    const cartTotal = useMemo(() => {
        return cartSubtotal;
    }, [cartSubtotal]);

    // Handle search
    const handleSearch = (results: Product[]) => {
        setSearchResults(results);
        setIsSearchActive(results.length > 0 || results.length === 0);
    };

    return (
        <div className="w-full h-[calc(100vh-90px)] flex gap-4 overflow-hidden p-4">
            {/* Products Section - Left Side (2/3 width) */}
            <div className="w-2/3 min-w-0 flex flex-col h-full">
                {/* Error */}
                {hasError && (
                    <div className="flex items-center justify-center h-full">
                        <RetryButton />
                    </div>
                )}

                {/* Display */}
                {!isLoading && !hasError && (
                    <>
                        {/* Search Bar */}
                        <div className="mb-4">
                            <SearchBar
                                data={productsWithPrices || []}
                                onSearch={handleSearch}
                                searchKeys={['product_name',  'sku_code']}
                                placeholder="Search products by name, description, or SKU..."
                                className="w-full"
                            />
                        </div>

                        {/* Product Grid - SCROLLABLE */}
                        <div className="flex-1 overflow-y-auto px-2 pb-4">
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredProducts.length > 0 ? (
                                    filteredProducts.map((product: Product) => (
                                        <ProductCard
                                            key={product.product_id}
                                            product={product}
                                            onAddToCart={handleAddToCart}
                                        />
                                    ))
                                ) : (
                                    <div className="col-span-full text-center text-gray-500 py-8">
                                        {isSearchActive ? 'No products found matching your search' : 'No products found'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Receipt Panel - Right Side (1/3 width) */}
            <div className="w-1/3 flex-shrink-0 min-w-[380px] h-full">
                <div className="h-full sticky top-0">
                    <ReceiptPanel
                        cart={cart}
                        cartTotal={cartTotal}
                        cartSubtotal={cartSubtotal}
                        onUpdateQuantity={handleUpdateQuantity}
                        onClearCart={handleClearCart}
                        stockAlertMap={stockAlertMap}
                        attributeData={attributeQueryData || []}
                        importPriceData={salePriceQueryData || []}
                    />
                </div>
            </div>
        </div>
    );
}