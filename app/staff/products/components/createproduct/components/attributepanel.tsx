"use client";
import { useState } from "react";
import { X, Plus, Save, ChevronDown } from "lucide-react";
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
import { SubmitBtn, SubmitBtnFull } from "@/app/components/ui";

interface AttributePrice {
  attribute_id: string;
  attribute_name: string;
  module: string;
  quantity: number;
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
      return; // Don't add duplicates
    }

    setAttributePrices([
      ...attributePrices,
      {
        attribute_id: subAttribute.attribute_id,
        attribute_name: subAttribute.attribute_name,
        module: subAttribute.module,
        price_value: 0,
        quantity: 1,
        product_image: "",
      },
    ]);
  };

  const handleUpdatePrice = (index: number, field: "price_value" | "quantity" | "product_image", value: string | number) => {
    const updated = [...attributePrices];
    if (field === "price_value" || field === "quantity") {
      updated[index][field] = Number(value);
    } else {
      updated[index][field] = String(value);
    }
    setAttributePrices(updated);
  };

  const handleRemoveAttribute = (index: number) => {
    setAttributePrices(attributePrices.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (attributePrices.length === 0) {
      return;
    }
    onSave(attributePrices);
    onClose();
  };

  const isAttributeAdded = (attributeId: string) => {
    return attributePrices.some((price) => price.attribute_id === attributeId);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Configure Product Attributes
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Module Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              1. Select Attribute Module
            </Label>
            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger className="w-full h-12 text-base border-2 hover:border-slate-400 transition-colors">
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
              <Label className="text-base font-semibold">
                2. Add Sub-Attributes for {selectedModule}
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {attributesByModule[selectedModule]?.map((attr) => {
                  const isAdded = isAttributeAdded(attr.attribute_id);
                  return (
                    <Button
                      key={attr.attribute_id}
                      type="button"
                      variant={isAdded ? "secondary" : "outline"}
                      className={`h-auto py-3 px-4 justify-start text-left transition-all ${
                        isAdded
                          ? "bg-slate-100 border-slate-300 cursor-not-allowed"
                          : "hover:border-slate-400 hover:bg-slate-50"
                      }`}
                      onClick={() => !isAdded && handleAddSubAttribute(attr)}
                      disabled={isAdded}
                    >
                      <div className="flex items-center gap-2 w-full">
                        {isAdded ? (
                          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        ) : (
                          <Plus className="w-5 h-5 flex-shrink-0" />
                        )}
                        <span className="capitalize font-medium">
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
              <Label className="text-base font-semibold">
                3. Set Quantity and Import Prices
              </Label>
              <div className="space-y-3">
                {attributePrices.map((price, index) => (
                  <div
                    key={price.attribute_id}
                    className="p-4 border-2 rounded-lg bg-gradient-to-r from-white to-slate-50 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1 bg-slate-200 rounded-full text-sm font-medium text-slate-700 capitalize">
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
                              placeholder="1"
                              value={price.quantity || ""}
                              onChange={(e) =>
                                handleUpdatePrice(index, "quantity", e.target.value)
                              }
                              className="h-11 border-2 focus:border-slate-400"
                              min="1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-slate-600 mb-1.5 block">
                              Import Price *
                            </Label>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={price.price_value || ""}
                              onChange={(e) =>
                                handleUpdatePrice(index, "price_value", e.target.value)
                              }
                              className="h-11 border-2 focus:border-slate-400"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveAttribute(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 mt-1"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {attributePrices.length === 0 && (
            <Alert className="border-2 border-dashed">
              <AlertDescription className="text-center text-slate-600">
                No attributes added yet. Select a module above and add sub-attributes to get started.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <div className="border-t p-6 bg-slate-50">
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
              className="bg-amber-300 text-amber-700 w-full border rounded"
            >
              <Save className="w-5 h-5 mr-2" />
              Save Attributes ({attributePrices.length})
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}