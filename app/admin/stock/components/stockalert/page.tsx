"use client";

import { useState } from "react";
import AutoCalculateMinStock from "./components/autocalculateminstock";
import MinStockCalculator from "./components/minstockcalculator";

export default function MinStockManagementPage() {
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [selectedProductName, setSelectedProductName] = useState<string>('');
    const [currentMinStock, setCurrentMinStock] = useState<number>(0);

    const handleBatchComplete = (results: any) => {
        console.log('Batch update completed:', results);
    };

    const handleProductUpdate = (newMinStock: number) => {
        setCurrentMinStock(newMinStock);
    };

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Minimum Stock Management</h1>
                <p className="text-gray-600 mt-2">
                    Automatically calculate optimal minimum stock levels for your inventory
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Batch Calculator - Left Side */}
                <div>
                    <AutoCalculateMinStock onComplete={handleBatchComplete} />
                </div>

                {/* Single Product Calculator - Right Side */}
                <div>
                    {selectedProductId ? (
                        <MinStockCalculator
                            productId={selectedProductId}
                            productName={selectedProductName}
                            currentMinStock={currentMinStock}
                            onUpdate={handleProductUpdate}
                        />
                    ) : (
                        <div className="border rounded-lg p-6 bg-white shadow-sm h-full flex items-center justify-center">
                            <div className="text-center text-gray-500">
                                <p className="text-sm">Select a product from the batch results</p>
                                <p className="text-xs mt-2">or run batch calculation to see products</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}