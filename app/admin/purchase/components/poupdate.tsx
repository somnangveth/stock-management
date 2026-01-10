// app/admin/purchase/components/po-edit-form.tsx
"use client";

import { useState, useMemo, useTransition } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { btnStyle, CancelBtn, edit, SubmitBtn, SubmitBtnFull } from "@/app/components/ui";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { 
  updatePurchaseOrderItem,
  deletePurchaseOrderItem,
  createPurchaseOrderItem,
  updatePurchaseOrder as updatePurchaseOrderAPI
} from "../action/purchaseorder";
import { fetchProducts, fetchVendors } from "@/app/functions/admin/api/controller";
import type { PurchaseOrderDetail, PurchaseItem } from "@/type/producttype";

// Zod Schema
const POEditFormSchema = z.object({
  vendor_id: z.number().positive("Please select a vendor"),
  purchase_date: z.string(),
  expected_delivery_date: z.string().optional(),
  payment_terms: z.string().optional(),
  note: z.string().optional(),
  items: z.array(
    z.object({
      purchase_item_id: z.string(),
      product_id: z.string().optional(),
      product_name: z.string().optional(),
      sku_code: z.string().optional(),
      quantity: z.number().min(1, "Quantity must be at least 1"),
      unit_price: z.number().min(0.01, "Unit price must be greater than 0"),
      batch_number: z.string().optional(),
      expiry_date: z.string().optional(),
      warehouse_location: z.string().optional(),
      _isNew: z.boolean().optional(),
    })
  ),
});

type POEditFormValues = z.infer<typeof POEditFormSchema>;

interface POEditFormProps {
  po: PurchaseOrderDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function POEditForm({
  po,
  onSuccess,
  onCancel,
}: POEditFormProps) {
  // State
  const [selectedVendorId, setSelectedVendorId] = useState<number>(po.vendor_id);
  const [isPending, startTransition] = useTransition();
  const [deletedItemIds, setDeletedItemIds] = useState<Set<string>>(new Set());

  // Fetch vendors
  const { data: vendors = [], isLoading: vendorsLoading } = useQuery({
    queryKey: ["vendors"],
    queryFn: fetchVendors,
  });

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  // Filter products for selected vendor
  const vendorProducts = useMemo(() => {
    if (!selectedVendorId || !products) return [];
    return products.filter((p: any) => p.vendor_id === selectedVendorId);
  }, [selectedVendorId, products]);

  // Form
  const form = useForm<POEditFormValues>({
    resolver: zodResolver(POEditFormSchema),
    defaultValues: {
      vendor_id: po.vendor_id,
      purchase_date: po.purchase_date,
      expected_delivery_date: po.expected_delivery_date || "",
      payment_terms: po.payment_terms || "",
      note: po.note || "",
      items: po.purchase_items.map((item) => ({
        purchase_item_id: item.purchase_item_id,
        product_id: item.product_id || "",
        product_name: item.product_name || "",
        sku_code: item.sku_code || "",
        quantity: item.quantity,
        unit_price: item.unit_price,
        batch_number: item.batch_number || "",
        expiry_date: item.expiry_date || "",
        warehouse_location: item.warehouse_location || "",
        _isNew: false,
      })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Calculate totals
  const items = form.watch("items");
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.unit_price || 0);
  }, 0);
  const originalSubtotal = po.subtotal;
  const subtotalChanged = Math.abs(subtotal - originalSubtotal) > 0.01;
  const tax = po.tax;
  const total = subtotal + tax;
  const originalTotal = po.total_amount;

  // Handle product selection - auto-fill unit price and product info
  const handleProductChange = (index: number, productId: string) => {
    const selectedProduct = vendorProducts.find((p: any) => p.product_id === productId);
    if (selectedProduct) {
      form.setValue(`items.${index}.unit_price`, selectedProduct.unit_price || 0);
      form.setValue(`items.${index}.product_name`, selectedProduct.product_name || "");
      form.setValue(`items.${index}.sku_code`, selectedProduct.sku_code || "");
      form.setValue(`items.${index}.product_id`, selectedProduct.product_id);
    }
  };

  // Handle item removal
  const handleRemoveItem = (index: number) => {
    const itemId = form.watch(`items.${index}.purchase_item_id`);
    const isNewItem = itemId.toString().startsWith("temp-");
    
    if (!isNewItem) {
      setDeletedItemIds(prev => new Set([...prev, itemId]));
    }
    
    remove(index);
  };

  // Submit handler
  const onSubmit = async (data: POEditFormValues) => {
    // Check if PO is draft
    if (po.status !== "draft") {
      toast.error("Only draft purchase orders can be edited");
      return;
    }

    startTransition(async () => {
      try {
        // Step 1: Delete removed items
        for (const itemId of deletedItemIds) {
          const deleteResult = await deletePurchaseOrderItem(itemId);
          if (deleteResult.error) {
            throw new Error(`Failed to delete item: ${deleteResult.error}`);
          }
        }

        // Step 2: Create new items
        const newItems = data.items.filter(item => 
          item.purchase_item_id.toString().startsWith("temp-")
        );

        for (const newItem of newItems) {
          if (!newItem.product_name || newItem.quantity <= 0 || newItem.unit_price <= 0) {
            throw new Error("Please fill all required fields for new items");
          }

          const createResult = await createPurchaseOrderItem(po.purchase_id, {
            product_id: newItem.product_id || null,
            quantity: newItem.quantity,
            unit_price: newItem.unit_price,
            total_price: newItem.quantity * newItem.unit_price,
            expiry_date: newItem.expiry_date || null,
            batch_number: newItem.batch_number || null,
            warehouse_location: newItem.warehouse_location || null,
          });

          if (createResult.error) {
            throw new Error(`Failed to create item: ${createResult.error}`);
          }
        }

        // Step 3: Update existing items
        const existingItems = data.items.filter(item => 
          !item.purchase_item_id.toString().startsWith("temp-")
        );

        for (let i = 0; i < existingItems.length; i++) {
          const item = existingItems[i];
          const result = await updatePurchaseOrderItem(item.purchase_item_id, {
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.quantity * item.unit_price,
            batch_number: item.batch_number || null,
            expiry_date: item.expiry_date || null,
            warehouse_location: item.warehouse_location || null,
          });

          if (result.error) {
            throw new Error(`Failed to update item: ${result.error}`);
          }
        }

        // Step 4: Update PO basic info if changed
        if (
          data.expected_delivery_date !== po.expected_delivery_date ||
          data.payment_terms !== po.payment_terms ||
          data.note !== po.note
        ) {
          const updateResult = await updatePurchaseOrderAPI(po.purchase_id, {
            expected_delivery_date: data.expected_delivery_date,
            payment_terms: data.payment_terms,
            note: data.note,
          });

          if (updateResult.error) {
            throw new Error(`Failed to update PO info: ${updateResult.error}`);
          }
        }

        toast.success("Purchase order updated successfully");
        
        // Wait for data to persist
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        onSuccess();
      } catch (error: any) {
        toast.error("Failed to update purchase order", {
          description: error.message,
        });
        console.error(error);
      }
    });
  };

  const isDataLoading = vendorsLoading || productsLoading;

  // Loading State
  if (isDataLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading form data...</p>
        </div>
      </div>
    );
  }

  // Check if PO is draft
  if (po.status !== "draft") {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between border-b pb-4 mb-6">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-semibold">Edit Purchase Order</h1>
          <div className="w-10" />
        </div>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-900">Cannot Edit</p>
              <p className="text-orange-800 text-sm mt-1">
                Only draft purchase orders can be edited. This purchase order has a status of <span className="font-bold">{po.status.toUpperCase()}</span>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* ===== Header with Back Button ===== */}
      <div className="flex items-center justify-between border-b pb-4">
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Back to Purchase Order"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="text-center">
          <h1 className="text-xl font-semibold">Edit Purchase Order</h1>
          <p className="text-sm text-gray-600">{po.po_number}</p>
        </div>
        <div className="w-10" />
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vendor - Read Only */}
                <FormItem>
                  <FormLabel>Vendor</FormLabel>
                  <div className="p-2 bg-gray-50 rounded border border-gray-200 text-sm">
                    {po.vendor_name}
                  </div>
                </FormItem>


                {/* Purchase Date - Read Only */}
                <FormItem>
                  <FormLabel>Purchase Date</FormLabel>
                  <div className="p-2 bg-gray-50 rounded border border-gray-200 text-sm">
                    {new Date(po.purchase_date).toLocaleDateString('en-US')}
                  </div>
                </FormItem>

                {/* Expected Delivery Date */}
                <FormField
                  control={form.control}
                  name="expected_delivery_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Delivery Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Payment Terms */}
                <FormField
                  control={form.control}
                  name="payment_terms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Terms</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Net 30" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Note */}
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any notes about this purchase order..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Items Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Purchase Items</CardTitle>
                <Button
                  type="button"
                  className={btnStyle}
                  size="sm"
                  onClick={() =>
                    append({
                      purchase_item_id: `temp-${Date.now()}`,
                      product_id: "",
                      product_name: "",
                      sku_code: "",
                      quantity: 1,
                      unit_price: 0,
                      batch_number: "",
                      expiry_date: "",
                      warehouse_location: "",
                      _isNew: true,
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No items found. Click "Add Item" to add products.
                </div>
              ) : (
                fields.map((field, index) => {
                  const isNewItem = form.watch(`items.${index}.purchase_item_id`).toString().startsWith("temp-");
                  const originalItem = po.purchase_items[index];
                  const currentQuantity = form.watch(`items.${index}.quantity`) || 0;
                  const currentPrice = form.watch(`items.${index}.unit_price`) || 0;
                  const currentTotal = currentQuantity * currentPrice;
                  const originalItemTotal = originalItem?.quantity * originalItem?.unit_price || 0;
                  const itemChanged = !isNewItem && Math.abs(currentTotal - originalItemTotal) > 0.01;


                  return (
                    <div
                      key={field.id}
                      className={`border rounded-lg p-4 space-y-4 ${isNewItem ? "bg-green-50 border-green-200" : "bg-white"}`}
                    >
                      {/* New Item Badge */}
                      {isNewItem && (
                        <div className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                          New Item
                        </div>
                      )}

                      {/* Product Info */}
                      {isNewItem ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Product Selection for New Items */}
                          {selectedVendorId && vendorProducts.length > 0 && (
                            <FormField
                              control={form.control}
                              name={`items.${index}.product_id`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Product (Optional)</FormLabel>
                                  <Select
                                    onValueChange={(v) => {
                                      field.onChange(v || "");
                                      handleProductChange(index, v);
                                    }}
                                    value={field.value || ""}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select product" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {vendorProducts.map((product: any) => (
                                        <SelectItem
                                          key={product.product_id}
                                          value={product.product_id}
                                        >
                                          {product.product_name} ({product.sku_code})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          {/* Manual Product Name for New Items */}
                          <FormField
                            control={form.control}
                            name={`items.${index}.product_name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Product Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Product Name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />


                          {/* SKU Code for New Items */}
                          <FormField
                            control={form.control}
                            name={`items.${index}.sku_code`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SKU Code</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., SKU-001" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b">
                          <div>
                            <p className="text-sm text-gray-600">Product Name</p>
                            <p className="font-semibold text-gray-900">{originalItem?.product_name}</p>
                          </div>
                          {originalItem?.sku_code && (
                            <div>
                              <p className="text-sm text-gray-600">SKU Code</p>
                              <p className="font-semibold text-gray-900">{originalItem?.sku_code}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Warning if already received (existing items only) */}
                      {!isNewItem && originalItem?.received_quantity > 0 && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <p className="font-semibold text-yellow-900">Already Partially Received</p>
                            <p className="text-yellow-800 mt-1">
                              {originalItem?.received_quantity} out of {originalItem?.quantity} units have been received.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Quantity and Unit Price */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Quantity */}
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantity *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  step="1"
                                  placeholder="0"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />


                        {/* Unit Price */}
                        <FormField
                          control={form.control}
                          name={`items.${index}.unit_price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit Price ($) *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  placeholder="0.00"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Price Comparison (existing items only) */}
                      {!isNewItem && (
                        <div className="p-4 bg-yellow-50 border border-yellow-500 rounded">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs text-yellow-600 font-medium">Original Total</p>
                              <p className="text-lg font-bold text-amber-800">${originalItemTotal.toFixed(2)}</p>
                            </div>
                            <div className="flex items-center justify-center">
                              {itemChanged && <p className="text-2xl text-yellow-600">→</p>}
                            </div>
                            <div>
                              <p className="text-xs text-yellow-600 font-medium">New Total</p>
                              <p className={`text-lg font-bold ${itemChanged ? "text-yellow-600" : "text-amber-800"}`}>
                                ${currentTotal.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          {itemChanged && (
                            <div className="mt-2 text-xs text-blue-700">
                              Difference: <span className={currentTotal > originalItemTotal ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                                {currentTotal > originalItemTotal ? "+" : ""}{(currentTotal - originalItemTotal).toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Item Total (new items only) */}
                      {isNewItem && (
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-sm font-medium">Item Total:</span>
                          <span className="text-lg font-bold text-green-600">
                            ${currentTotal.toFixed(2)}
                          </span>
                        </div>
                      )}



                      {/* Batch Information */}
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-4">Batch Information (Optional)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Batch Number */}
                          <FormField
                            control={form.control}
                            name={`items.${index}.batch_number`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Batch Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., BATCH-001" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Expiry Date */}
                          <FormField
                            control={form.control}
                            name={`items.${index}.expiry_date`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Expiry Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Warehouse Location */}
                          <FormField
                            control={form.control}
                            name={`items.${index}.warehouse_location`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Warehouse Location</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., A1-B2" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Remove Button */}
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                          className="w-full"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove Item
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>



          {/* Summary Card */}
          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <div className="font-medium">
                    <span className={subtotalChanged ? "text-yellow-600" : ""}>
                      ${subtotal.toFixed(2)}
                    </span>
                    {subtotalChanged && (
                      <span className="text-xs text-gray-600 ml-2">
                        (was ${originalSubtotal.toFixed(2)})
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <div>
                    <span className={subtotalChanged ? "text-yellow-500" : "text-yellow-800"}>
                      ${total.toFixed(2)}
                    </span>
                    {subtotalChanged && (
                      <span className="text-xs text-gray-600 ml-2">
                        (was ${originalTotal.toFixed(2)})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="submit" disabled={isPending} 
            className={SubmitBtn}>
              {isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {isPending ? "Updating..." : "Update Purchase Order"}
            </Button>
            <Button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className={CancelBtn}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}