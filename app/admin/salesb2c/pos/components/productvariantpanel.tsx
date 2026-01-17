"use client";
import { Product } from "@/type/producttype";
import { useState, useMemo } from "react";
import { X, Plus, Minus, Package, ShoppingCart } from "lucide-react";
import { styledToast } from "@/app/components/toast";

type Attribute = {
    attribute_id: string;
    attribute_name: string;
    module: string;
}

type ImportPrice = {
    import_price_id?: string;
    product_id: string;
    attribute_id: string | null;
    price_value: number;
    quantity?: number;
    attribute_value?: number;
}

type VariantSelection = {
    attribute_id: string;
    attribute_name: string;
    quantity: number;
    price_value: number;
    units_per_pack: number;
}

interface ProductVariantPanelProps {
    product: Product;
    attributes: Attribute[];
    importPrices: ImportPrice[];
    stockQuantity: number;
    onClose: () => void;
    onSave: (selections: VariantSelection[], totalUnits: number, totalPrice: number) => void;
}

export default function ProductVariantPanel({
    product,
    attributes,
    importPrices,
    stockQuantity,
    onClose,
    onSave
}: ProductVariantPanelProps) {
    // Initialize variant selections
    const [selections, setSelections] = useState<Map<string, VariantSelection>>(new Map());

    // Map variant sizes to display names and units
    const variantConfig = useMemo(() => ({
        'small': { label: '+1 Item', icon: '📦', units: 1 },
        'medium': { label: '+1 Medium Pack', icon: '📦', units: 12 },
        'large': { label: '+1 Box', icon: '🗃️', units: 24 }
    }), []);

    // Get available variants with their prices
    const availableVariants = useMemo(() => {
        return attributes
            .map(attr => {
                const priceData = importPrices.find(
                    price => price.attribute_id === attr.attribute_id
                );
                
                if (!priceData) return null;

                const variantKey = attr.attribute_name.toLowerCase();
                const config = variantConfig[variantKey as keyof typeof variantConfig];
                
                if (!config) return null;

                return {
                    attribute_id: attr.attribute_id,
                    attribute_name: attr.attribute_name,
                    display_label: config.label,
                    icon: config.icon,
                    units_per_pack: config.units,
                    price_value: priceData.price_value,
                    price_per_unit: priceData.price_value / config.units
                };
            })
            .filter(Boolean)
            .sort((a, b) => {
                const order = { small: 1, medium: 2, large: 3 };
                return order[a!.attribute_name.toLowerCase() as keyof typeof order] - 
                       order[b!.attribute_name.toLowerCase() as keyof typeof order];
            });
    }, [attributes, importPrices, variantConfig]);

    // Calculate totals
    const totals = useMemo(() => {
        let totalUnits = 0;
        let totalPrice = 0;
        let totalPacks = 0;

        selections.forEach(selection => {
            const units = selection.quantity * selection.units_per_pack;
            const price = selection.quantity * selection.price_value;
            totalUnits += units;
            totalPrice += price;
            totalPacks += selection.quantity;
        });

        return { totalUnits, totalPrice, totalPacks };
    }, [selections]);

    // Handle quantity change
    const handleQuantityChange = (
        attribute_id: string,
        attribute_name: string,
        price_value: number,
        units_per_pack: number,
        delta: number
    ) => {
        setSelections(prev => {
            const newSelections = new Map(prev);
            const current = newSelections.get(attribute_id);
            const currentQty = current?.quantity || 0;
            const newQty = Math.max(0, currentQty + delta);

            // Calculate how many units this would be
            const newTotalUnits = totals.totalUnits - (currentQty * units_per_pack) + (newQty * units_per_pack);

            // Check stock
            if (newTotalUnits > stockQuantity) {
                styledToast.error(`Insufficient stock. Only ${stockQuantity} units available.`);
                return prev;
            }

            if (newQty === 0) {
                newSelections.delete(attribute_id);
            } else {
                newSelections.set(attribute_id, {
                    attribute_id,
                    attribute_name,
                    quantity: newQty,
                    price_value,
                    units_per_pack
                });
            }

            return newSelections;
        });
    };

    // Handle save
    const handleSave = () => {
        if (selections.size === 0) {
            styledToast.error("Please select at least one variant");
            return;
        }

        if (totals.totalUnits > stockQuantity) {
            styledToast.error("Total units exceed available stock");
            return;
        }

        const selectionsArray = Array.from(selections.values());
        onSave(selectionsArray, totals.totalUnits, totals.totalPrice);
    };

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b">
                <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-600" />
                    <h2 className="font-semibold text-gray-800">Select Variants</h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 rounded-full transition"
                    type="button"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {/* Product Info */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-1">{product.product_name}</h3>
                <div className="text-sm text-gray-600 space-y-1">
                    <p>SKU: {product.sku_code || product.sku_code || 'N/A'}</p>
                    <p className="flex items-center gap-2">
                        <span>Stock Available:</span>
                        <span className={`font-semibold ${stockQuantity > 50 ? 'text-green-600' : stockQuantity > 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {stockQuantity} units
                        </span>
                    </p>
                </div>
            </div>

            {/* Variants Selection */}
            <div className="flex-1 overflow-y-auto mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Choose Pack Size</h3>
                
                {availableVariants.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                        No variants available for this product
                    </div>
                ) : (
                    <div className="space-y-3">
                        {availableVariants.map((variant) => {
                            if (!variant) return null;
                            
                            const selection = selections.get(variant.attribute_id);
                            const quantity = selection?.quantity || 0;

                            return (
                                <div
                                    key={variant.attribute_id}
                                    className={`border rounded-lg p-4 transition ${
                                        quantity > 0 
                                            ? 'border-amber-500 bg-yellow-50' 
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-lg">{variant.icon}</span>
                                                <h4 className="font-medium text-gray-800 capitalize">
                                                    {variant.attribute_name}
                                                </h4>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                {variant.display_label} ({variant.units_per_pack} units)
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-gray-800">
                                                ${variant.price_value.toFixed(2)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                ${variant.price_per_unit.toFixed(2)}/unit
                                            </p>
                                        </div>
                                    </div>

                                    {/* Quantity Controls */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => handleQuantityChange(
                                                    variant.attribute_id,
                                                    variant.attribute_name,
                                                    variant.price_value,
                                                    variant.units_per_pack,
                                                    -1
                                                )}
                                                disabled={quantity === 0}
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            
                                            <span className="w-12 text-center font-semibold text-gray-800">
                                                {quantity}
                                            </span>
                                            
                                            <button
                                                type="button"
                                                onClick={() => handleQuantityChange(
                                                    variant.attribute_id,
                                                    variant.attribute_name,
                                                    variant.price_value,
                                                    variant.units_per_pack,
                                                    1
                                                )}
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-600 hover:bg-amber-700 text-white transition"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {quantity > 0 && (
                                            <div className="text-right">
                                                <p className="text-sm text-gray-600">
                                                    {quantity * variant.units_per_pack} units
                                                </p>
                                                <p className="text-sm font-semibold text-amber-600">
                                                    ${(quantity * variant.price_value).toFixed(2)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Summary */}
            {selections.size > 0 && (
                <div className="border-t pt-3 mb-3 space-y-2">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Order Summary</h3>
                    
                    <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between text-gray-600">
                            <span>Total Packs:</span>
                            <span className="font-medium">{totals.totalPacks}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Total Units:</span>
                            <span className="font-medium">{totals.totalUnits}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Remaining Stock:</span>
                            <span className={`font-medium ${
                                (stockQuantity - totals.totalUnits) < 10 
                                    ? 'text-red-600' 
                                    : 'text-green-600'
                            }`}>
                                {stockQuantity - totals.totalUnits} units
                            </span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-gray-800 border-t pt-2 mt-2">
                            <span>Total Price:</span>
                            <span className="text-amber-600">${totals.totalPrice.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={selections.size === 0}
                    className="flex-1 py-2.5 px-4 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                </button>
            </div>
        </div>
    );
}