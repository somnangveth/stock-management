"use client";

import { useState, useTransition } from "react";
import { RefreshCw, TrendingUp, TrendingDown, Minus, Calculator, CheckCircle, AlertCircle } from "lucide-react";
import { styledToast } from "@/app/components/toast";

type MinStockResult = {
    success: boolean;
    min_stock_level?: number;
    method?: string;
    calculations?: {
        velocity: number;
        statistical: number;
        seasonal: number | null;
        hybrid: number;
    };
    metrics?: {
        total_sales: number;
        days_analyzed: number;
        average_daily_sales: number;
        peak_daily_sales: number;
        std_deviation: number;
        trend: 'increasing' | 'decreasing' | 'stable';
    };
    error?: string;
};

interface MinStockCalculatorProps {
    productId: string;
    productName: string;
    currentMinStock?: number;
    onUpdate?: (newMinStock: number) => void;
}

export default function MinStockCalculator({
    productId,
    productName,
    currentMinStock = 0,
    onUpdate
}: MinStockCalculatorProps) {
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<MinStockResult | null>(null);
    const [showConfig, setShowConfig] = useState(false);
    
    // Configuration state
    const [config, setConfig] = useState({
        lookbackDays: 90,
        leadTimeDays: 7,
        safetyStockMultiplier: 1.5,
        minThreshold: 10,
        seasonalAdjustment: true
    });

    const calculateMinStock = async () => {
        startTransition(async () => {
            try {
                const response = await fetch('/api/admin/stock/calculate-min', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        product_id: productId,
                        config 
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    setResult(data);
                    styledToast.success(`Calculated minimum stock: ${data.min_stock_level} units`);
                } else {
                    styledToast.error(data.error || 'Calculation failed');
                    setResult(data);
                }
            } catch (error: any) {
                styledToast.error('Failed to calculate minimum stock');
                console.error(error);
            }
        });
    };

    const applyRecommendation = async () => {
        if (!result?.min_stock_level || result.min_stock_level === undefined) return;

        const minStockValue = result.min_stock_level;

        startTransition(async () => {
            try {
                const response = await fetch('/api/admin/stock/update-min', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        product_id: productId,
                        min_stock_level: minStockValue
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    styledToast.success('Minimum stock updated successfully');
                    onUpdate?.(minStockValue);
                } else {
                    styledToast.error('Failed to update minimum stock');
                }
            } catch (error) {
                styledToast.error('Failed to update minimum stock');
                console.error(error);
            }
        });
    };

    const getTrendIcon = (trend?: string) => {
        switch (trend) {
            case 'increasing':
                return <TrendingUp className="w-4 h-4 text-green-600" />;
            case 'decreasing':
                return <TrendingDown className="w-4 h-4 text-red-600" />;
            default:
                return <Minus className="w-4 h-4 text-gray-600" />;
        }
    };

    const getTrendColor = (trend?: string) => {
        switch (trend) {
            case 'increasing':
                return 'text-green-600 bg-green-50';
            case 'decreasing':
                return 'text-red-600 bg-red-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <div className="border rounded-lg p-6 bg-white shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">{productName}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Current Min Stock: <span className="font-medium">{currentMinStock} units</span>
                    </p>
                </div>
                <button
                    onClick={() => setShowConfig(!showConfig)}
                    className="text-sm text-blue-600 hover:text-blue-800 transition"
                >
                    {showConfig ? 'Hide' : 'Show'} Config
                </button>
            </div>

            {/* Configuration Panel */}
            {showConfig && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Configuration</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-gray-600">Lookback Days</label>
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
                            <label className="text-xs text-gray-600">Lead Time (days)</label>
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
                            <label className="text-xs text-gray-600">Safety Multiplier</label>
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
                            <label className="text-xs text-gray-600">Min Threshold</label>
                            <input
                                type="number"
                                value={config.minThreshold}
                                onChange={(e) => setConfig({...config, minThreshold: parseInt(e.target.value)})}
                                className="w-full px-3 py-2 border rounded text-sm"
                                min="1"
                            />
                        </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={config.seasonalAdjustment}
                            onChange={(e) => setConfig({...config, seasonalAdjustment: e.target.checked})}
                            className="rounded"
                        />
                        <span className="text-gray-700">Enable Seasonal Adjustment</span>
                    </label>
                </div>
            )}

            {/* Calculate Button */}
            <button
                onClick={calculateMinStock}
                disabled={isPending}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
                {isPending ? (
                    <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Calculating...
                    </>
                ) : (
                    <>
                        <Calculator className="w-4 h-4" />
                        Calculate Minimum Stock
                    </>
                )}
            </button>

            {/* Results */}
            {result && result.success && result.metrics && result.min_stock_level !== undefined && (
                <div className="mt-6 space-y-4">
                    {/* Recommendation */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-600 font-medium">Recommended Minimum Stock</p>
                                <p className="text-3xl font-bold text-blue-700 mt-1">
                                    {result.min_stock_level} units
                                </p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-blue-600" />
                        </div>
                        {currentMinStock !== result.min_stock_level && (
                            <div className="mt-3 pt-3 border-t border-blue-200">
                                <p className="text-xs text-blue-600">
                                    Change: {result.min_stock_level > currentMinStock ? '+' : ''}
                                    {result.min_stock_level - currentMinStock} units 
                                    ({((((result.min_stock_level - currentMinStock) / Math.max(currentMinStock, 1)) * 100)).toFixed(1)}%)
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Sales Metrics */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600">Avg Daily Sales</p>
                            <p className="text-lg font-semibold text-gray-800 mt-1">
                                {result.metrics.average_daily_sales.toFixed(2)}
                            </p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600">Peak Daily Sales</p>
                            <p className="text-lg font-semibold text-gray-800 mt-1">
                                {result.metrics.peak_daily_sales}
                            </p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600">Total Sales</p>
                            <p className="text-lg font-semibold text-gray-800 mt-1">
                                {result.metrics.total_sales}
                            </p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600">Days Analyzed</p>
                            <p className="text-lg font-semibold text-gray-800 mt-1">
                                {result.metrics.days_analyzed}
                            </p>
                        </div>
                    </div>

                    {/* Trend */}
                    <div className={`p-3 rounded-lg flex items-center gap-2 ${getTrendColor(result.metrics.trend)}`}>
                        {getTrendIcon(result.metrics.trend)}
                        <div>
                            <p className="text-sm font-medium capitalize">{result.metrics.trend} Trend</p>
                            <p className="text-xs opacity-75">
                                Standard Deviation: {result.metrics.std_deviation.toFixed(2)}
                            </p>
                        </div>
                    </div>

                    {/* Calculation Methods */}
                    {result.calculations && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Calculation Methods</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Velocity-Based:</span>
                                    <span className="font-medium">{result.calculations.velocity} units</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Statistical:</span>
                                    <span className="font-medium">{result.calculations.statistical} units</span>
                                </div>
                                {result.calculations.seasonal !== null && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Seasonal:</span>
                                        <span className="font-medium">{result.calculations.seasonal} units</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-2 border-t border-gray-300">
                                    <span className="text-gray-800 font-semibold">Hybrid (Recommended):</span>
                                    <span className="font-bold text-blue-600">{result.calculations.hybrid} units</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Apply Button */}
                    {currentMinStock !== result.min_stock_level && (
                        <button
                            onClick={applyRecommendation}
                            disabled={isPending}
                            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition"
                        >
                            Apply Recommendation
                        </button>
                    )}
                </div>
            )}

            {/* Error State */}
            {result && !result.success && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-red-800">Calculation Failed</p>
                        <p className="text-sm text-red-600 mt-1">{result.error || 'Unknown error occurred'}</p>
                        {result.min_stock_level !== undefined && (
                            <p className="text-xs text-red-600 mt-2">
                                Using minimum threshold: {result.min_stock_level} units
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}