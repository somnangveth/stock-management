"use client";
import { useState, useEffect } from "react";
import { X, Save, AlertCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Attribute } from "@/type/producttype";
import { SubmitBtnFull } from "@/app/components/ui";
import { toast } from "sonner";

interface SalePrice {
  attribute_id: string;
  attribute_name: string;
  module: string;
  price_value: number;
  price_variance: number;
  attribute_value: number;
  import_price?: number;
}

interface SalePricePanelProps {
  attribute: Attribute[];
  onSave: (prices: SalePrice[]) => void;
  onClose: () => void;
  initialPrices?: SalePrice[];
}

export default function SalePricePanel({
  attribute,
  onSave,
  onClose,
  initialPrices = [],
}: SalePricePanelProps) {
  const [salePrices, setSalePrices] = useState<SalePrice[]>(initialPrices);

  // Update state when initialPrices change
  useEffect(() => {
    setSalePrices(initialPrices);
  }, [initialPrices]);

  const handleUpdatePrice = (
    index: number,
    field: "price_value" | "price_variance" | "attribute_value",
    value: string | number
  ) => {
    const updated = [...salePrices];
    updated[index][field] = Number(value);
    setSalePrices(updated);
  };

  const handleSave = () => {
    // Validate that all required fields are filled
    const invalid = salePrices.filter(
      (price) => price.price_value < 0 || price.price_variance < 0 || price.attribute_value < 1
    );

    if (invalid.length > 0) {
      toast.error("Please ensure all prices and variances are non-negative and quantities are at least 1");
      return;
    }

    const hasZeroPrices = salePrices.filter((price) => price.price_value === 0);
    if (hasZeroPrices.length > 0) {
      toast.error("Please set sale prices for all variants (price cannot be $0)");
      return;
    }

    if (salePrices.length === 0) {
      toast.error("No prices to save");
      return;
    }

    onSave(salePrices);
    onClose();
  };

  // Calculate profit margins
  const calculateMargin = (salePrice: number, importPrice?: number) => {
    if (!importPrice || importPrice === 0) return null;
    return ((salePrice - importPrice) / importPrice * 100).toFixed(1);
  };

  // Calculate average margin
  const avgMargin = salePrices.reduce((sum, price) => {
    const margin = calculateMargin(price.price_value, price.import_price);
    return sum + (margin ? Number(margin) : 0);
  }, 0) / salePrices.length;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-5xl my-8 flex flex-col max-h-[90vh] shadow-2xl border-2 border-yellow-200">
        <CardHeader className="border-b-2 border-amber-600 bg-yellow-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold bg-yellow-100 bg-clip-text text-transparent">
                Configure Sale Prices
              </CardTitle>
              <p className="text-sm text-slate-600 mt-1">
                Set retail prices and variance for each product variant
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-emerald-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            

            <div className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 rounded-lg p-4">
              <div>
                <p className="text-sm font-medium text-amber-800">Total Quantity</p>
                <p className="text-2xl font-bold text-amber-700 mt-1">
                  {salePrices.reduce((sum, p) => sum + (p.attribute_value || 0), 0)}
                </p>
              </div>
            </div>

            <div className="bg-yellow-100 border-2 border-amber-200 rounded-lg p-4">
              <div>
                <p className="text-sm font-medium text-amber-800">Total Sale Value</p>
                <p className="text-2xl font-bold text-amber-700 mt-1">
                  ${salePrices.reduce((sum, p) => sum + p.price_value, 0).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="bg-yellow-100 border-amber-700 rounded-lg p-4">
              <div>
                <p className="text-sm font-medium text-amber-800">Avg. Margin</p>
                <p className={`text-2xl font-bold mt-1 ${
                  avgMargin > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isNaN(avgMargin) ? 'N/A' : `${avgMargin > 0 ? '+' : ''}${avgMargin.toFixed(1)}%`}
                </p>
              </div>
            </div>
          </div>

          {/* Price Configuration */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2 text-slate-700">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 text-sm font-bold">
                ⚙
              </span>
              Price Configuration
            </Label>
            
            {salePrices.length === 0 ? (
              <Alert className="border-2 border-dashed border-emerald-300 bg-emerald-50">
                <AlertCircle className="h-5 w-5 text-emerald-600" />
                <AlertDescription className="text-emerald-800">
                  No variants available for pricing. Please select a product first.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
                {salePrices.map((price, index) => {
                  const margin = calculateMargin(price.price_value, price.import_price);
                  const isLowMargin = margin && Number(margin) < 20;
                  const isNegativeMargin = margin && Number(margin) < 0;

                  return (
                    <div
                      key={price.attribute_id}
                      className={`p-5 border-2 rounded-lg transition-all ${
                        isNegativeMargin 
                          ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200 hover:border-red-300' 
                          : isLowMargin
                          ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 hover:border-amber-300'
                          : 'bg-gradient-to-r from-white to-yellow-50 border-yellow-200 hover:border-yellow-300'
                      }`}
                    >
                      <div className="space-y-4">
                        {/* Attribute Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="px-3 py-1.5 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full text-sm font-semibold text-emerald-800 capitalize shadow-sm">
                              {price.module}
                            </div>
                            <span className="text-lg font-bold capitalize text-slate-800">
                              {price.attribute_name}
                            </span>
                          </div>
                          {margin && (
                            <div className={`px-3 py-1.5 rounded-full text-sm font-bold shadow-sm ${
                              isNegativeMargin
                                ? 'bg-red-100 text-red-700'
                                : isLowMargin
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {Number(margin) > 0 ? '+' : ''}{margin}% margin
                            </div>
                          )}
                        </div>

                        {/* Price Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Import Price (Read-only) */}
                          {price.import_price !== undefined && (
                            <div>
                              <Label className="text-sm text-slate-600 mb-1.5 block font-medium">
                                Import Cost
                              </Label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">
                                  $
                                </span>
                                <Input
                                  type="number"
                                  value={price.import_price}
                                  readOnly
                                  className="h-11 border-2 bg-slate-50 text-slate-600 pl-7 font-semibold cursor-not-allowed"
                                />
                              </div>
                            </div>
                          )}

                          {/* Quantity */}
                          <div>
                            <Label className="text-sm text-slate-700 mb-1.5 block font-semibold">
                              Quantity *
                            </Label>
                            <Input
                              type="number"
                              placeholder="1"
                              value={price.attribute_value || ""}
                              onChange={(e) =>
                                handleUpdatePrice(index, "attribute_value", e.target.value)
                              }
                              className="h-11 border-2 border-violet-300 focus:border-violet-500 font-semibold text-violet-700 transition-colors"
                              min="1"
                            />
                          </div>

                          {/* Sale Price */}
                          <div>
                            <Label className="text-sm text-slate-700 mb-1.5 block font-semibold">
                              Sale Price *
                            </Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">
                                $
                              </span>
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={price.price_value || ""}
                                onChange={(e) =>
                                  handleUpdatePrice(index, "price_value", e.target.value)
                                }
                                className="h-11 border-2 border-emerald-300 focus:border-emerald-500 pl-7 font-semibold text-emerald-700 transition-colors"
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Price Summary Display */}
                        {price.price_value > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {price.price_variance > 0 && (
                              <div className="text-sm bg-slate-100 rounded-lg px-4 py-2.5 border border-slate-200">
                                <span className="font-medium text-slate-700">Price Range:</span>{" "}
                                <span className="font-bold text-slate-900">
                                  ${(price.price_value - price.price_variance).toFixed(2)} - ${(price.price_value + price.price_variance).toFixed(2)}
                                </span>
                              </div>
                            )}
                            <div className="text-sm bg-blue-100 rounded-lg px-4 py-2.5 border border-blue-200">
                              <span className="font-medium text-blue-700">Total Value:</span>{" "}
                              <span className="font-bold text-blue-900">
                                ${(price.price_value * (price.attribute_value || 1)).toFixed(2)}
                              </span>
                              <span className="text-xs text-blue-600 ml-1">
                                ({price.attribute_value || 1} × ${price.price_value})
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Warnings */}
                        {isNegativeMargin && (
                          <Alert className="border-red-300 bg-red-50">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800 text-sm">
                              ⚠️ Warning: Sale price is lower than import cost (negative margin)
                            </AlertDescription>
                          </Alert>
                        )}
                        {isLowMargin && !isNegativeMargin && (
                          <Alert className="border-amber-300 bg-amber-50">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="text-amber-800 text-sm">
                              Note: Profit margin is below 20%
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>

        <div className="border-t-2 border-yellow-100 p-6 bg-yellow-50 flex-shrink-0">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 text-base border-2 border-slate-300 hover:bg-slate-100 transition-all"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={salePrices.length === 0}
              className={`${SubmitBtnFull} flex-1 h-12 text-base bg-amber-500 shadow-lg hover:shadow-xl transition-all`}
            >
              <Save className="w-5 h-5 mr-2" />
              Save Configuration ({salePrices.length} variant{salePrices.length !== 1 ? "s" : ""})
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}