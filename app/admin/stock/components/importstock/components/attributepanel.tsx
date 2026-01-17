"use client";
import { useState, useEffect } from "react";
import { X, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Attribute } from "@/type/producttype";
import { SubmitBtnFull } from "@/app/components/ui";
import { toast } from "sonner";

interface AttributePrice {
  attribute_id: string;
  attribute_name: string;
  module: string;
  attribute_value: number;
  price_value: number;
  product_image: string;
}

interface AttributePanelProps {
  attribute: Attribute[];
  onSave: (prices: AttributePrice[]) => void;
  onClose: () => void;
  initialPrices?: AttributePrice[];
}

export default function AttributePanel({
  attribute,
  onSave,
  onClose,
  initialPrices = [],
}: AttributePanelProps) {
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [attributePrices, setAttributePrices] = useState<AttributePrice[]>(initialPrices);

  // Update state when initialPrices change
  useEffect(() => {
    setAttributePrices(initialPrices);
  }, [initialPrices]);

  // Group attributes by module
  const attributesByModule = attribute.reduce((acc, attr) => {
    if (!acc[attr.module]) {
      acc[attr.module] = [];
    }
    acc[attr.module].push(attr);
    return acc;
  }, {} as Record<string, Attribute[]>);

  const modules = Object.keys(attributesByModule);

  const handleAddSubAttribute = (subAttribute: Attribute) => {
    // Check if already added
    const exists = attributePrices.some(
      (price) => price.attribute_id === subAttribute.attribute_id
    );

    if (exists) {
      toast.info("This attribute is already added");
      return;
    }

    setAttributePrices([
      ...attributePrices,
      {
        attribute_id: subAttribute.attribute_id,
        attribute_name: subAttribute.attribute_name,
        module: subAttribute.module,
        price_value: 0,
        attribute_value: 1,
        product_image: "",
      },
    ]);
    toast.success(`Added ${subAttribute.attribute_name}`);
  };

  const handleUpdatePrice = (
    index: number,
    field: "price_value" | "attribute_value" | "product_image",
    value: string | number
  ) => {
    const updated = [...attributePrices];
    if (field === "price_value" || field === "attribute_value") {
      updated[index][field] = Number(value);
    } else {
      updated[index][field] = String(value);
    }
    setAttributePrices(updated);
  };

  const handleRemoveAttribute = (index: number) => {
    const removed = attributePrices[index];
    setAttributePrices(attributePrices.filter((_, i) => i !== index));
    toast.success(`Removed ${removed.attribute_name}`);
  };

  const handleSave = () => {
    // Validate that all required fields are filled
    const invalid = attributePrices.filter(
      (price) => price.attribute_value < 1 || price.price_value < 0
    );

    if (invalid.length > 0) {
      toast.error("Please ensure all quantities are at least 1 and prices are non-negative");
      return;
    }

    if (attributePrices.length === 0) {
      toast.error("Please add at least one attribute");
      return;
    }

    onSave(attributePrices);
    onClose();
  };

  const isAttributeAdded = (attributeId: string) => {
    return attributePrices.some((price) => price.attribute_id === attributeId);
  };

  // Calculate total quantity
  const totalQuantity = attributePrices.reduce((sum, price) => sum + price.attribute_value, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-5xl my-8 flex flex-col max-h-[90vh]">
        <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-orange-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-slate-800">
                Configure Stock Attributes
              </CardTitle>
              <p className="text-sm text-slate-600 mt-1">
                Set quantities and import prices for each product variant
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-amber-100"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Total Quantity Summary */}
          {attributePrices.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Total Batch Quantity</p>
                  <p className="text-xs text-green-600">
                    Sum of all attribute quantities
                  </p>
                </div>
                <div className="text-3xl font-bold text-green-700">{totalQuantity}</div>
              </div>
            </div>
          )}

          {/* Module Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-sm">
                1
              </span>
              Select Attribute Module
            </Label>
            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger className="w-full h-12 text-base border-2 hover:border-amber-400 transition-colors">
                <SelectValue placeholder="Choose a module (e.g., Size, Weight, Color)" />
              </SelectTrigger>
              <SelectContent>
                {modules.map((module) => (
                  <SelectItem
                    key={module}
                    value={module}
                    className="text-base capitalize cursor-pointer"
                  >
                    {module}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sub-attributes Selection */}
          {selectedModule && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label className="text-base font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-sm">
                  2
                </span>
                Add Variants for {selectedModule}
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {attributesByModule[selectedModule]?.map((attr) => {
                  const isAdded = isAttributeAdded(attr.attribute_id);
                  return (
                    <Button
                      key={attr.attribute_id}
                      type="button"
                      variant={isAdded ? "secondary" : "outline"}
                      className={`h-auto py-3 px-4 justify-start text-left transition-all ${
                        isAdded
                          ? "bg-green-50 border-green-300 cursor-not-allowed"
                          : "hover:border-amber-400 hover:bg-amber-50"
                      }`}
                      onClick={() => !isAdded && handleAddSubAttribute(attr)}
                      disabled={isAdded}
                    >
                      <div className="flex items-center gap-2 w-full">
                        {isAdded ? (
                          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">✓</span>
                          </div>
                        ) : (
                          <Plus className="w-5 h-5 flex-shrink-0 text-amber-600" />
                        )}
                        <span className="capitalize font-medium truncate">
                          {attr.attribute_name}
                        </span>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Added Attributes with Pricing */}
          {attributePrices.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-sm">
                  3
                </span>
                Configure Quantities and Import Prices
              </Label>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {attributePrices.map((price, index) => (
                  <div
                    key={price.attribute_id}
                    className="p-4 border-2 rounded-lg bg-gradient-to-r from-white to-slate-50 hover:border-amber-300 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full text-sm font-medium text-amber-800 capitalize">
                            {price.module}
                          </div>
                          <span className="text-base font-semibold capitalize">
                            {price.attribute_name}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <Label className="text-sm text-slate-600 mb-1.5 block">
                              Quantity *
                            </Label>
                            <Input
                              type="number"
                              placeholder="Enter quantity"
                              value={price.attribute_value || ""}
                              onChange={(e) =>
                                handleUpdatePrice(index, "attribute_value", e.target.value)
                              }
                              className="h-11 border-2 focus:border-amber-400"
                              min="1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-slate-600 mb-1.5 block">
                              Import Price (per unit) *
                            </Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                $
                              </span>
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={price.price_value || ""}
                                onChange={(e) =>
                                  handleUpdatePrice(index, "price_value", e.target.value)
                                }
                                className="h-11 border-2 focus:border-amber-400 pl-7"
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm text-slate-600 mb-1.5 block">
                              Product Image URL
                            </Label>
                            <Input
                              type="text"
                              placeholder="https://..."
                              value={price.product_image || ""}
                              onChange={(e) =>
                                handleUpdatePrice(index, "product_image", e.target.value)
                              }
                              className="h-11 border-2 focus:border-amber-400"
                            />
                          </div>
                        </div>
                        {/* Show calculated total for this attribute */}
                        <div className="text-sm text-slate-600 bg-slate-100 rounded px-3 py-2">
                          <span className="font-medium">Total Value:</span>{" "}
                          <span className="font-bold text-slate-800">
                            ${(price.attribute_value * price.price_value).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveAttribute(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 mt-1 flex-shrink-0"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {attributePrices.length === 0 && (
            <Alert className="border-2 border-dashed border-amber-300 bg-amber-50">
              <AlertDescription className="text-center text-slate-600">
                <div className="flex flex-col items-center gap-2 py-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-amber-600" />
                  </div>
                  <p className="font-medium">No attributes configured yet</p>
                  <p className="text-sm">
                    Select a module above and add variants to get started
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <div className="border-t p-6 bg-slate-50 flex-shrink-0">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 text-base"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={attributePrices.length === 0}
              className={`${SubmitBtnFull} flex-1`}
            >
              <Save className="w-5 h-5 mr-2" />
              Save Configuration ({attributePrices.length} variant
              {attributePrices.length !== 1 ? "s" : ""})
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}