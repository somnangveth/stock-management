"use client";

import { Categories, Product, Subcategories } from "@/type/producttype";
import { circleCross, faMinusCircle, faPlusCircle, trash } from "../ui";

// Product Card
export function ProductCard({
    product, 
    onAddToCart
}: {
    product: Product, 
    onAddToCart: (product: Product) => void
}) {
    return (
        <button
            onClick={() => onAddToCart(product)} 
            className="relative flex flex-col space-y-2 border border-gray-500 p-2 bg-white shadow-md hover:bg-gray-200 transition rounded-lg overflow-hidden"
        >
            {/* Diagonal Discount Badge */}
            {product.discount_price && (
                <div className="absolute top-0 right-0 z-10">
                    <div className="bg-red-600 text-white text-xs font-bold px-8 py-1 transform rotate-45 translate-x-6 -translate-y-5 shadow-md">
                        {String(product.discount_percent)}%
                    </div>
                </div>
            )}
            
            {product.product_image ? (
                <img 
                    src={product.product_image} 
                    alt={product.product_name} 
                    className="w-full h-32 object-cover rounded"
                />
            ) : (
                <img 
                    src="/assets/product_default.jpg" 
                    alt="no image" 
                    className="w-full h-32 object-cover rounded"
                />
            )}
            
            <div className="flex justify-between items-center">
                <div className="truncate max-w-[120px] text-sm">{product.product_name}</div>
                <div>
                    {product.discount_price ? (
                        <div className="flex flex-col items-end">
                            <span className="font-semibold text-green-600">${String(product.discount_price)}</span>
                            <span className="text-xs text-gray-500 line-through">${String(product.total_price)}</span>
                        </div>
                    ) : (
                        <span className="font-semibold text-green-600">${String(product.total_price)}</span>
                    )}
                </div>
            </div>
            
            <div className="flex justify-between">
                <p className="text-xs">Qty: {product.current_quantity}</p>
                <p className="text-xs">Pkg: {product.package_qty}</p>
            </div>
        </button>
    );
}

interface ProductOrderCardProps{
    product: Product;
    quantity: number;
    totalPrice: number;
    onUpdateQuantity: (product_id: string | number, quantity: number) => void;
}
export function ProductOrderCard({
    product, 
    quantity = 1,
    totalPrice = 0,
    onUpdateQuantity,
}: ProductOrderCardProps) {
    
    const handleClearItem = () => {
        onUpdateQuantity(product.product_id, quantity = 0);
    }

    const handleMinus = () => {
        console.log('MINUS CLICKED');
        console.log('Product ID:', product.product_id);
        console.log('Current quantity:', quantity);
        onUpdateQuantity(product.product_id, quantity - 1);
    };
    
    const handlePlus = () => {
        console.log('PLUS CLICKED');
        console.log('Product ID:', product.product_id);
        console.log('Current quantity:', quantity);
        onUpdateQuantity(product.product_id, quantity + 1);
    };
    
    return (
        <div className="flex gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
            {product.product_image ? (
                <img 
                    src={product.product_image} 
                    alt={product.product_name} 
                    className="w-16 h-16 object-cover rounded"
                />
            ) : (
                <img 
                    src="/assets/product_default.jpg" 
                    alt="no image" 
                    className="w-16 h-16 object-cover rounded"
                />
            )}
            <div className="flex flex-col flex-1 justify-between">
                <p className="font-medium text-sm">{product.product_name}</p>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleMinus}
                        className="w-6 h-6 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-900 transition"
                    >
                        {faMinusCircle}
                    </button>
                    <span className="text-sm font-medium text-center min-w-[30px]">{quantity}</span>
                    <button
                        type="button"
                        onClick={handlePlus}
                        className="w-6 h-6 flex items-center justify-center rounded-full text-amber-700 hover:text-amber-900 transition"
                    >
                        {faPlusCircle}
                    </button>
                </div>
            </div>
            <div className="flex items-center gap-3">
                {product.discount_price ? (
                    <p className="font-semibold text-green-600">${product.discount_price.toFixed(2)}</p>
                ):(
                    <p className="font-semibold text-green-600">${totalPrice.toFixed(2)}</p>
                )}
                <button
                type="button"
                className="bg-transparent hover:bg-transparent text-red-700"
                onClick={handleClearItem}>
                    {circleCross}
                </button>
            </div>
        </div>
    );
}



