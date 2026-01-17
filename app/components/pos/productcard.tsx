"use client";

import { Categories, Product} from "@/type/producttype";
import { circleCross, faMinusCircle, faPlusCircle, trash } from "../ui";

type CartItem = {
    product: any;
    quantity: number;
    totalPrice: number;
    package_qty: number;
}

export function ProductCard({
    product,
    onAddToCart,
}: {
    product: Product;
    onAddToCart: (product: Product) => void;
}) {
    // Try to get price from multiple possible fields
    const displayPrice = product.total_price || product.price_value || 0;
    
    console.log("ProductCard - Product:", product.product_name, "Price:", displayPrice);
    
    return (
        <button
            onClick={() => onAddToCart(product)}
            className="relative w-full flex flex-col 
                       border border-gray-500 bg-white
                       hover:bg-gray-50 transition overflow-hidden"
        >
            {/* Image */}
            <img
                src={product.product_image || "/assets/product_default.jpg"}
                alt={product.product_name}
                className="w-full h-32 object-cover"
            />

            {/* Content */}
            <div className="p-3">
                <div className="flex justify-between items-start gap-3">
                    
                    {/* LEFT PANEL */}
                    <div className="flex flex-col min-w-0">
                        <p className="text-sm font-semibold truncate">
                            {product.product_name}
                        </p>
                        <span className="text-xs text-gray-500">
                            price: ${displayPrice.toFixed(2)}
                        </span>
                    </div>

                </div>
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
        onUpdateQuantity(product.product_id, 0);
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

    // Calculate quantity breakdown
    const getQuantityBreakdown = (totalUnits: number) => {
        const boxes = Math.floor(totalUnits / 24);
        const remainingAfterBoxes = totalUnits % 24;
        const packs = Math.floor(remainingAfterBoxes / 12);
        const units = remainingAfterBoxes % 12;

        const parts = [];
        if (boxes > 0) parts.push(`${boxes} ${boxes === 1 ? 'box' : 'boxes'}`);
        if (packs > 0) parts.push(`${packs} ${packs === 1 ? 'pack' : 'packs'}`);
        if (units > 0) parts.push(`${units} ${units === 1 ? 'unit' : 'units'}`);

        return parts.length > 0 ? parts.join(' + ') : '0 units';
    };

    // Format quantity display
    const quantityDisplay = getQuantityBreakdown(quantity);
    
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
                <div>
                    <p className="font-medium text-sm">{product.product_name}</p>
                    {/* Quantity Breakdown Display */}
                    <p className="text-xs text-gray-600 mt-1">
                        <span className="font-semibold text-amber-700">{quantity}</span> total units
                        {quantity > 1 && (
                            <span className="block text-xs text-gray-500 mt-0.5">
                                ({quantityDisplay})
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2 mt-2">
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