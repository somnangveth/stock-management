"use client";

import { useState, useTransition } from "react";
import { RefreshCw, CheckCircle, AlertCircle, TrendingUp, Package, Zap } from "lucide-react";
import { styledToast } from "@/app/components/toast";

type ProductMinStockResult = {
    product_id: string;
    product_name: string;
    old_min_stock: number;
    new_min_stock: number;
    change: number;
    change_percent: number;
    success: boolean;
    metrics?: {
        total_sales: number;
        average_daily_sales: number;
        trend: 'increasing' | 'decreasing' | 'stable';
    };
};

type BatchUpdateResult = {
    success: boolean;
    updated_count: number;
    total_count: number;
    results: ProductMinStockResult[];
    error?: string;
};

interface AutoCalculateMinStockProps {
    onComplete?: (results: BatchUpdateResult) => void;
}

export default function AutoCalculateMinStock({ onComplete }: AutoCalculateMinStockProps) {
    const [isPending, startTransition] = useTransition();
    const [batchResult, setBatchResult] = useState<BatchUpdateResult | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    
    // Configuration state
    const [config, setConfig] = useState({
        lookbackDays: 90,
        leadTimeDays: 7,
        safetyStockMultiplier: 1.5,
        minThreshold: 10,
        seasonalAdjustment: true,
        autoApply: true // Auto-apply recommendations
    });

    const calculateAllMinStock = async () => {
        startTransition(async () => {
            try {
                const response = await fetch('/api/admin/updateallmin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        config,
                        auto_apply: config.autoApply
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    setBatchResult(data);
                    styledToast.success(`Updated ${data.updated_count} of ${data.total_count} products`);
                    onComplete?.(data);
                } else {
                    styledToast.error(data.error || 'Batch calculation failed');
                    setBatchResult(data);
                }
            } catch (error: any) {
                styledToast.error('Failed to calculate minimum stock levels');
                console.error(error);
            }
        });
    };

    const getTrendIcon = (trend?: string) => {
        switch (trend) {
            case 'increasing':
                return <TrendingUp className="w-3 h-3 text-green-600" />;
            case 'decreasing':
                return <TrendingUp className="w-3 h-3 text-red-600 rotate-180" />;
            default:
                return null;
        }
    };

    const getChangeColor = (change: number) => {
        if (change > 0) return 'text-green-600';
        if (change < 0) return 'text-red-600';
        return 'text-gray-600';
    };

    return (
        <div className="border rounded-lg p-6 bg-white shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                    <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">Auto-Calculate Min Stock</h3>
                    <p className="text-sm text-gray-500">Batch update all products from stock alert table</p>
                </div>
            </div>

            {/* Configuration */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Batch Configuration</h4>
                
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-gray-600 block mb-1">Lookback Days</label>
                        <input
                            type="number"
                            value={config.lookbackDays}
                            onChange={(e) => setConfig({...config, lookbackDays: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border rounded text-sm"
                            min="7"
                            max="365"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-600 block mb-1">Lead Time (days)</label>
                        <input
                            type="number"
                            value={config.leadTimeDays}
                            onChange={(e) => setConfig({...config, leadTimeDays: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border rounded text-sm"
                            min="1"
                            max="90"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-600 block mb-1">Safety Multiplier</label>
                        <input
                            type="number"
                            step="0.1"
                            value={config.safetyStockMultiplier}
                            onChange={(e) => setConfig({...config, safetyStockMultiplier: parseFloat(e.target.value)})}
                            className="w-full px-3 py-2 border rounded text-sm"
                            min="1"
                            max="3"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-600 block mb-1">Min Threshold</label>
                        <input
                            type="number"
                            value={config.minThreshold}
                            onChange={(e) => setConfig({...config, minThreshold: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border rounded text-sm"
                            min="1"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={config.seasonalAdjustment}
                            onChange={(e) => setConfig({...config, seasonalAdjustment: e.target.checked})}
                            className="rounded"
                        />
                        <span className="text-gray-700">Enable Seasonal Adjustment</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={config.autoApply}
                            onChange={(e) => setConfig({...config, autoApply: e.target.checked})}
                            className="rounded"
                        />
                        <span className="text-gray-700">Auto-apply recommendations (update database)</span>
                    </label>
                </div>
            </div>

            {/* Calculate Button */}
            <button
                onClick={calculateAllMinStock}
                disabled={isPending}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
                {isPending ? (
                    <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Processing Products...
                    </>
                ) : (
                    <>
                        <Package className="w-4 h-4" />
                        Calculate All Products
                    </>
                )}
            </button>

            {/* Results Summary */}
            {batchResult && batchResult.success && (
                <div className="mt-6 space-y-4">
                    {/* Summary Card */}
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="text-sm text-green-600 font-medium">Batch Update Complete</p>
                                <p className="text-2xl font-bold text-green-700 mt-1">
                                    {batchResult.updated_count} / {batchResult.total_count}
                                </p>
                                <p className="text-xs text-green-600 mt-1">products updated</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="text-sm text-green-700 hover:text-green-800 font-medium"
                        >
                            {showDetails ? 'Hide Details' : 'Show Details'}
                        </button>
                    </div>

                    {/* Detailed Results */}
                    {showDetails && batchResult.results && (
                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-4 py-2 border-b">
                                <h4 className="text-sm font-semibold text-gray-700">Product Details</h4>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {batchResult.results.map((product, index) => (
                                    <div 
                                        key={product.product_id}
                                        className={`p-4 border-b last:border-b-0 hover:bg-gray-50 transition ${
                                            !product.success ? 'bg-red-50' : ''
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-gray-800">
                                                        {product.product_name}
                                                    </p>
                                                    {product.metrics && getTrendIcon(product.metrics.trend)}
                                                </div>
                                                
                                                {product.success ? (
                                                    <div className="mt-2 text-sm space-y-1">
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-gray-600">
                                                                Old: <span className="font-medium">{product.old_min_stock}</span>
                                                            </span>
                                                            <span className="text-gray-600">→</span>
                                                            <span className="text-gray-600">
                                                                New: <span className="font-medium text-blue-600">{product.new_min_stock}</span>
                                                            </span>
                                                            <span className={`font-medium ${getChangeColor(product.change)}`}>
                                                                {product.change > 0 ? '+' : ''}{product.change} 
                                                                ({product.change_percent > 0 ? '+' : ''}{product.change_percent.toFixed(1)}%)
                                                            </span>
                                                        </div>
                                                        
                                                        {product.metrics && (
                                                            <div className="text-xs text-gray-500">
                                                                Avg Daily Sales: {product.metrics.average_daily_sales.toFixed(2)} | 
                                                                Total: {product.metrics.total_sales} units
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-red-600 mt-1">
                                                        Failed to calculate
                                                    </p>
                                                )}
                                            </div>
                                            
                                            {product.success ? (
                                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                            ) : (
                                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Statistics */}
                    {showDetails && batchResult.results && (
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 bg-gray-50 rounded-lg text-center">
                                <p className="text-xs text-gray-600">Increased</p>
                                <p className="text-lg font-semibold text-green-600 mt-1">
                                    {batchResult.results.filter(r => r.change > 0).length}
                                </p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg text-center">
                                <p className="text-xs text-gray-600">Decreased</p>
                                <p className="text-lg font-semibold text-red-600 mt-1">
                                    {batchResult.results.filter(r => r.change < 0).length}
                                </p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg text-center">
                                <p className="text-xs text-gray-600">Unchanged</p>
                                <p className="text-lg font-semibold text-gray-600 mt-1">
                                    {batchResult.results.filter(r => r.change === 0).length}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Error State */}
            {batchResult && !batchResult.success && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-red-800">Batch Calculation Failed</p>
                        <p className="text-sm text-red-600 mt-1">{batchResult.error || 'Unknown error occurred'}</p>
                    </div>
                </div>
            )}
        </div>
    );
}