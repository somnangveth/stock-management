"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Package, CheckCircle2, AlertCircle, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { receivePurchaseOrder } from "../action/recieve";
import type { PurchaseOrderDetail } from "@/type/producttype";

interface ReceiveDialogProps {
  po: PurchaseOrderDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

interface ItemFormData {
  purchase_item_id: string;
  product_name: string;
  quantity: number;
  received_quantity: number;
  batch_number: string;
  expiry_date: string;
  warehouse_location: string;
}

export default function ReceiveDialog({ po, onSuccess, onCancel }: ReceiveDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [actualDeliveryDate, setActualDeliveryDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [items, setItems] = useState<ItemFormData[]>(
    po.purchase_items.map((item) => ({
      purchase_item_id: item.purchase_item_id,
      product_name: item.product_name,
      quantity: item.quantity,
      received_quantity: item.received_quantity || 0,
      batch_number: item.batch_number || "",
      expiry_date: item.expiry_date || "",
      warehouse_location: item.warehouse_location || "",
    }))
  );

  const handleItemChange = (index: number, field: keyof ItemFormData, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateCompletion = () => {
    const total = items.length;
    const completed = items.filter((item) => item.received_quantity >= item.quantity).length;
    return { completed, total, percentage: Math.round((completed / total) * 100) };
  };

  const validation = calculateCompletion();
  const hasChanges = items.some(
    (item, idx) => 
      item.received_quantity !== po.purchase_items[idx].received_quantity ||
      item.batch_number !== (po.purchase_items[idx].batch_number || "") ||
      item.expiry_date !== (po.purchase_items[idx].expiry_date || "") ||
      item.warehouse_location !== (po.purchase_items[idx].warehouse_location || "")
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!actualDeliveryDate) {
      toast.error("Please select delivery date");
      return;
    }

    if (!hasChanges) {
      toast.error("No changes made");
      return;
    }

    // Validate quantities
    const invalidItems = items.filter((item) => item.received_quantity < 0);
    if (invalidItems.length > 0) {
      toast.error("Received quantity cannot be negative");
      return;
    }

    const itemsToUpdate = items.map((item) => ({
      purchase_item_id: item.purchase_item_id,
      received_quantity: item.received_quantity,
      batch_number: item.batch_number || undefined,
      expiry_date: item.expiry_date || undefined,
      warehouse_location: item.warehouse_location || undefined,
    }));

    try {
      setIsLoading(true);

      const result = await receivePurchaseOrder({
        poId: po.purchase_id,
        items: itemsToUpdate,
        actualDeliveryDate,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      const message = result.data?.allReceived 
        ? "Purchase order fully received!" 
        : "Purchase order partially received";
      
      toast.success(message);
      onSuccess();
    } catch (error: any) {
      toast.error("Failed to receive: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-white to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Receive Purchase Order</h2>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-semibold">{po.po_number}</span> from <span className="font-semibold">{po.vendor_name}</span>
            </p>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Delivery Date Section */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    Actual Delivery Date
                  </div>
                </label>
                <Input
                  type="date"
                  value={actualDeliveryDate}
                  onChange={(e) => setActualDeliveryDate(e.target.value)}
                  className="border-gray-300"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Progress Summary */}
          <div className="p-6 border-b border-gray-200 bg-white">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              Receipt Progress Summary
            </h3>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-linear-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
                <p className="text-sm text-red-500 font-medium">Total Items</p>
                <p className="text-3xl font-bold text-red-900 mt-1">{validation.total}</p>
              </div>
              <div className="p-4 bg-linear-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                <p className="text-sm text-green-600 font-medium">Completed Items</p>
                <p className="text-3xl font-bold text-green-900 mt-1">{validation.completed}</p>
              </div>
              <div className="p-4 bg-linear-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-600 font-medium">Completion Rate</p>
                <p className="text-3xl font-bold text-amber-800 mt-1">{validation.percentage}%</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-900">Overall Progress</p>
                <p className="text-sm font-semibold text-gray-600">
                  {validation.completed}/{validation.total} items
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-linear-to-r from-yellow-500 to-yellow-600 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${validation.percentage}%` }}
                />
              </div>
            </div>
          </div>

Jade peakz, [9/1/26 16:03 ]


          {/* Items List */}
          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            <h3 className="font-semibold text-gray-900 sticky top-0 bg-white py-2">
              Items Details
            </h3>

            {items.map((item, index) => {
              const originalItem = po.purchase_items[index];
              const isFullyReceived = item.received_quantity >= item.quantity;
              const changed = item.received_quantity !== originalItem.received_quantity;

              return (
                <div
                  key={item.purchase_item_id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-yellow-300 transition-colors"
                >
                  {/* Item Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{item.product_name}</p>
                      <p className="text-sm text-gray-600">
                        Ordered: <span className="font-semibold">{item.quantity}</span> units
                      </p>
                    </div>
                    {isFullyReceived && (
                      <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold whitespace-nowrap ml-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Complete
                      </div>
                    )}
                  </div>

                  {/* Main Fields Grid */}
                  <div className="mb-3">
                    {/* Received Quantity */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Received Quantity *
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          value={item.received_quantity}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "received_quantity",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="border-gray-300 flex-1"
                          disabled={isLoading}
                        />
                        <span className="text-sm text-gray-600 font-medium whitespace-nowrap">
                          / {item.quantity}
                        </span>
                      </div>
                      {changed && (
                        <p className={`text-xs mt-1 ${
                          item.received_quantity > originalItem.received_quantity 
                            ? "text-green-600" 
                            : "text-orange-600"
                        }`}>
                          {item.received_quantity > originalItem.received_quantity ? "+" : ""}
                          {item.received_quantity - originalItem.received_quantity} change
                        </p>
                      )}
                    </div>

                  </div>

Jade peakz, [9/1/26 16:03 ]


                  {/* Secondary Fields Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    {/* Batch Number */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Batch Number
                      </label>
                      <Input
                        type="text"
                        value={item.batch_number}
                        onChange={(e) =>
                          handleItemChange(index, "batch_number", e.target.value)
                        }
                        className="border-gray-300"
                        placeholder="e.g., 202401-001"
                        disabled={isLoading}
                      />
                    </div>

                    {/* Expiry Date */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Expiry Date
                      </label>
                      <Input
                        type="date"
                        value={item.expiry_date}
                        onChange={(e) =>
                          handleItemChange(index, "expiry_date", e.target.value)
                        }
                        className="border-gray-300"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Warehouse Location */}
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Warehouse Location
                    </label>
                    <Input
                      type="text"
                      value={item.warehouse_location}
                      onChange={(e) =>
                        handleItemChange(index, "warehouse_location", e.target.value)
                      }
                      className="border-gray-300"
                      placeholder="e.g., A-01-05"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Status Alerts */}
                  {item.received_quantity > item.quantity && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded flex items-start gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-yellow-900">Over Quantity</p>
                        <p className="text-yellow-800 text-xs">
                          Receiving {item.received_quantity - item.quantity} more than ordered
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

Jade peakz, [9/1/26 16:03 ]


          {/* Action Buttons */}
          <div className="flex gap-3 p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !hasChanges}
              className="flex-1
                  bg-linear-to-r from-amber-500
                  to-amber-400
                  hover:from-amber-400
                  hover:to-amber-300
                  text-slate-900
                  font-medium tracking-wide antialiased
                  border border-amber-300"
                  >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm Receipt
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}