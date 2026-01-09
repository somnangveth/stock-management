"use client";

import { IsLoading, RetryButton } from "@/app/components/error/error";
import { ProductCard } from "@/app/components/pos/productcard";
import { 
    fetchCategoryAndSubcategory, 
    fetchDealers, 
    fetchDiscount, 
    fetchPricesB2B,
    fetchProducts, 
    fetchStockAlert
} from "@/app/functions/admin/api/controller";
import { Categories, Discount, Product, StockAlert, Subcategories } from "@/type/producttype";
import { useQueries } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import ReceiptPanelB2B from "./receiptpanel";
import { styledToast } from "@/app/components/toast";

type CartItem = {
    product: Product;
    quantity: number;
    totalPrice: number;
    package_qty: number;
    package_type: 'box' | 'case';
}

export default function ProductCardListB2B(){
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    
    const result = useQueries({
        queries: [
            {
                queryKey: ["productQuery"],
                queryFn: fetchProducts,
            },
            {
                queryKey: ["Category-Subcategory-Query"],
                queryFn: fetchCategoryAndSubcategory,
            },
            {
                queryKey: ["priceB2BQuery"],
                queryFn: fetchPricesB2B,
            },
            {
                queryKey: ["discountQuery"],
                queryFn: fetchDiscount,
            },
            {
                queryKey: ["stockAlertQuery"],
                queryFn: fetchStockAlert,
            },
            {
                queryKey: ["dealerQuery"],
                queryFn: fetchDealers,
            }
        ]
    });

    const productQueryResult = result[0].data;
    const categorysubcategoryData = result[1].data;
    const priceQueryResult = result[2].data;
    const discountQueryData = result[3].data;
    const stockAlertQueryData = result[4].data;
    const dealerData = result[5].data;
    const isLoading = result.some(r => r.isLoading);
    const hasError = result.some(r => r.error);

    const productData = useMemo(() => {
        if(!productQueryResult) return null;
        return productQueryResult.product || productQueryResult;
    }, [productQueryResult]);

    const stockAlertMap = useMemo(() => {
      if(!stockAlertQueryData?.length) return new Map();

      const map = new Map<string, StockAlert>();
      stockAlertQueryData.forEach((alert: StockAlert) => {
        map.set(alert.product_id, alert);
      });
      return map;
    }, [stockAlertQueryData]);

    const priceData = useMemo(() => {
        if(!priceQueryResult) return[];

        let prices = Array.isArray(priceQueryResult) ?
        priceQueryResult : (priceQueryResult.prices || priceQueryResult);

        if(discountQueryData && Array.isArray(discountQueryData)){
            prices = prices.map((price: any) => {
                if(price.discount_id !== null){
                    const activeDiscount = discountQueryData.find((d: Discount) => 
                    d.discount_id === price.discount_id && d.discount_status === "active");

                    if(activeDiscount){
                        return{
                            ...price,
                            discount_amount: activeDiscount.discount_price,
                            discount_percent: activeDiscount.discount_percent
                        };
                    }
                }
                return price;
            })
        }
        return prices;
    }, [priceQueryResult, discountQueryData]);

    const productsWithPrices = useMemo(() => {
        if(!productData || !priceData) return productData || [];

        return productData.map((product: Product) => {
            const price = priceData.find((p: any) => p.product_id === product.product_id);
            const stockAlert = stockAlertMap.get(product.product_id);

            if(price){
                return{
                    ...product,
                    base_price: price.base_price,
                    // Use b2b_price for B2B transactions, fallback to total_amount or base_price
                    total_price: price.b2b_price || price.total_amount || price.base_price || 0,
                    tax: price.tax_amount,
                    discount_price: price.discount_amount,
                    discount_percent: price.discount_percent,
                    shipping: price.shipping,
                    profit_price: price.profit_price,
                    current_quantity: stockAlert?.current_quantity,
                    package_qty: stockAlert?.package_qty,
                    units_per_package: product.units_per_package || 1,
                };
            }
            return product;
        });
    }, [productData, priceData, stockAlertMap]);

    const categories = useMemo(() => {
        if(!categorysubcategoryData) return[];
        return(categorysubcategoryData.categories || categorysubcategoryData);
    }, [categorysubcategoryData]);

    const subcategories = useMemo(() => {
        if(!selectedCategory || !categorysubcategoryData){
            return[];
        }

        const allSubcategories = categorysubcategoryData.subcategories || [];
        const selectedCat = categories.find((cat: Categories) => 
        String(cat.category_id) === selectedCategory);

        if(!selectedCat){
            return [];
        }

        const filtered = allSubcategories.filter((sub: Subcategories) => {
            return sub.category_id === selectedCat.category_id;
        });

        return filtered;
    }, [selectedCategory, categories, categorysubcategoryData]);

    const filteredProducts = useMemo(() => {
        if(!productsWithPrices || !Array.isArray(productsWithPrices)) return [];
        
        let filtered = productsWithPrices;

        if(selectedCategory){
            filtered = filtered.filter((product: Product) => 
            product.category_id === Number(selectedCategory)
        || String(product.category_id) === selectedCategory);
        }

        if(selectedSubcategory){
            filtered = filtered.filter((product: Product) =>
            product.subcategory_id === Number(selectedSubcategory)
        || String(product.subcategory_id) === selectedSubcategory);
        }

        return filtered;
    }, [productsWithPrices, selectedCategory, selectedSubcategory]);

    const handleAddToCart = (product: Product, packageType: 'box' | 'case' = 'box') => {
        const stockAlert = stockAlertMap.get(String(product.product_id));
        const unitsPerPackage = product.units_per_package || 1;

        setCart(prevCart => {
            const existingItemIndex = prevCart.findIndex(
                item => String(item.product.product_id) === String(product.product_id) &&
                        item.package_type === packageType
            );

            const priceToUse = Number(product.total_price) || 0;
            
            // Validate price exists
            if(priceToUse === 0){
                styledToast.error("Product price not available");
                return prevCart;
            }

            const newPackageQty = existingItemIndex > -1 ? prevCart[existingItemIndex].package_qty + 1 : 1;
            const newTotalUnits = newPackageQty * unitsPerPackage;

            // Check if enough packages available
            if(stockAlert && newPackageQty > stockAlert.package_qty){
              styledToast.error(`Insufficient ${packageType}s available. Only ${stockAlert.package_qty} ${packageType}(s) in stock.`);
              return prevCart;
            }

            // Check if enough units available
            if(stockAlert && newTotalUnits > stockAlert.current_quantity){
              styledToast.error("Insufficient stock available");
              return prevCart;
            }

            if(existingItemIndex > -1){
              const updatedCart = [...prevCart];
              updatedCart[existingItemIndex].package_qty += 1;
              updatedCart[existingItemIndex].quantity = updatedCart[existingItemIndex].package_qty * unitsPerPackage;
              updatedCart[existingItemIndex].totalPrice = updatedCart[existingItemIndex].package_qty * priceToUse;
              return updatedCart;
            }else{
                return [...prevCart, {
                    product: {...product, units_per_package: unitsPerPackage},
                    quantity: unitsPerPackage,
                    totalPrice: priceToUse,
                    package_qty: 1,
                    package_type: packageType,
                }]
            }
        })
    };

    const handleUpdateQuantity = (
        productId: number | string, 
        newQuantity: number,
        packageQty: number,
        packageType: 'box' | 'case'
    ) => {
        if(packageQty <= 0){
            setCart(prevCart => 
                prevCart.filter(item => 
                    !(String(item.product.product_id) === String(productId) && 
                      item.package_type === packageType)
                )
            );
        }else{
            const stockAlert = stockAlertMap.get(String(productId));

            if(stockAlert && packageQty > stockAlert.package_qty){
              styledToast.error(`Insufficient ${packageType}s available`);
              return;
            }

            if(stockAlert && newQuantity > stockAlert.current_quantity){
              styledToast.error("Insufficient stock available");
              return;
            }

            setCart(prevCart => 
                prevCart.map(item => {
                    if(String(item.product.product_id) === String(productId) && 
                       item.package_type === packageType){
                        const priceToUse = Number(item.product.total_price) || 0;
                        
                        return {
                            ...item,
                            package_qty: packageQty,
                            quantity: newQuantity,
                            totalPrice: packageQty * priceToUse
                        };
                    }
                    return item;
                })
            );
        }
    }

    const handleClearCart = () => {
        setCart([]);
    }

    const cartSubtotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.totalPrice, 0);
    }, [cart]);

    const cartDiscount = useMemo(() => {
        return cart.reduce((total, item) => {
            const discountReceipt = cartSubtotal || 0;
            return total + (discountReceipt * item.quantity);
        },0);
    }, [cart]);

    const cartTax = useMemo(() => {
        return cart.reduce((total, item) => {
            const taxPerItem = Number(item.product.tax_amount) || 0;
            return total + (taxPerItem * item.quantity);
        }, 0)
    }, [cart]);

    const cartTotal = useMemo(() => {
        return cartSubtotal - cartDiscount + cartTax;
    }, [cartSubtotal, cartDiscount, cartTax]);

return (
  <div className="w-full h-[calc(100vh-100px)] flex gap-4 overflow-hidden p-4">
    <div className="w-2/3 min-w-0 flex flex-col h-full">
      {hasError && (
        <div className="flex items-center justify-center h-full">
          <RetryButton />
        </div>
      )}

      {!isLoading && !hasError && (
        <>
          <div className="flex flex-col flex-shrink-0">
            <div className="flex gap-2 mb-3 pb-2 overflow-x-auto overflow-y-hidden scrollbar-hide max-w-full">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedSubcategory(null);
                }}
                className={`flex shrink-0 min-w-[100px] px-4 py-2 rounded-lg transition
                  ${!selectedCategory ? 'bg-gray-800 text-white' : 'bg-transparent border border-gray-500 hover:bg-gray-100'}
                `}
              >
                All
              </button>
              {categories.map((cat: Categories) => (
                <button
                  key={cat.category_id}
                  onClick={() => {
                    setSelectedCategory(String(cat.category_id));
                    setSelectedSubcategory(null);
                  }}
                  className={`flex-shrink-0 min-w-[90px] px-4 py-2 rounded-lg transition whitespace-nowrap overflow-hidden
                    ${selectedCategory === String(cat.category_id) ? 'bg-gray-800 text-white' : 'bg-transparent border border-gray-500 hover:bg-gray-100'}
                  `}
                >
                  {cat.category_name}
                </button>
              ))}
            </div>

            {subcategories.length > 0 && (
              <div className="relative max-w-full overflow-hidden">
                <div className="flex gap-2 mb-3 pb-2 overflow-x-auto overflow-y-hidden scrollbar-hide whitespace-nowrap">
                  <button
                    onClick={() => setSelectedSubcategory(null)}
                    className={`flex-shrink-0 px-4 py-1 rounded-full text-sm font-medium transition
                      ${!selectedSubcategory
                        ? 'bg-amber-600 text-white'
                        : 'bg-transparent border border-gray-400 text-gray-700 hover:bg-gray-100'}
                    `}
                  >
                    All
                  </button>

                  {subcategories.map((sub: Subcategories) => (
                    <button
                      key={sub.subcategory_id}
                      onClick={() => setSelectedSubcategory(String(sub.subcategory_id))}
                      className={`flex-shrink-0 px-4 py-1 rounded-full text-sm font-medium transition whitespace-nowrap
                        ${selectedSubcategory === String(sub.subcategory_id)
                          ? 'bg-amber-600 text-white'
                          : 'bg-transparent border border-gray-400 text-gray-700 hover:bg-gray-100'}
                      `}
                    >
                      {sub.subcategory_name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product: Product) => (
                  <ProductCard
                    key={product.product_id}
                    product={product}
                    onAddToCart={(prod) => handleAddToCart(prod, 'box')}
                  />
                ))
              ) : (
                <div className="col-span-full text-center text-gray-500 py-8">
                  No products found
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>

    <div className="w-1/3 flex-shrink-0 min-w-[380px] h-full">
      <div className="h-full sticky top-0">
        <ReceiptPanelB2B
          dealers={dealerData ?? []}
          cart={cart}
          cartTotal={cartTotal}
          cartSubtotal={cartSubtotal}
          onUpdateQuantity={handleUpdateQuantity}
          onClearCart={handleClearCart}
        />
      </div>
    </div>
  </div>
);
}