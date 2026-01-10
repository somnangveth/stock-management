// app/admin/purchase-order/components/po-form.tsx
"use client";

import { useState, useMemo, useTransition } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { btnStyle, plusCircle } from "@/app/components/ui";
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
import { Trash2, Plus, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { createPurchaseOrder } from "../action/purchaseorder";
import { deletePurchaseOrder } from "../action/purchaseorder";
import { fetchProducts, fetchVendors } from "@/app/functions/admin/api/controller";
import { POFormActions } from "./poformaction";

// Zod Schema - Fixed to properly type the numbers
const POFormSchema = z.object({
  vendor_id: z.number().positive("Please select a vendor"),
  purchase_date: z.string(),
  expected_delivery_date: z.string().optional(),
  payment_terms: z.string().optional(),
  status: z.string().optional(),
  PurchaseStatus: z.string().optional(),
  note: z.string().optional(),
  items: z.array(
    z.object({
      product_id: z.string().optional(),
      quantity: z.number().min(1, "Quantity must be at least 1"),
      unit_price: z.number().min(0.01, "Unit price must be greater than 0"),
      tax: z.number().min(0).optional(),
      expiry_date: z.string().optional(),
      batch_number: z.string().optional(),
      warehouse_location: z.string().optional(),
    })
  ),
});

type POFormValues = z.infer<typeof POFormSchema>;

export default function POForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  // State
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

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

  // 筛选该供应商的产品（使用 useMemo）
  const vendorProducts = useMemo(() => {
    if (!selectedVendorId || !products) return [];
    return products.filter((p: any) => p.vendor_id === selectedVendorId);
  }, [selectedVendorId, products]);

  // Form
  const form = useForm<POFormValues>({
    resolver: zodResolver(POFormSchema),
    defaultValues: {
      vendor_id: 0,
      purchase_date: new Date().toISOString().split("T")[0],
      expected_delivery_date: "",
      payment_terms: "",
      PurchaseStatus: "pending",
      note: "",
      items: [
        {
          product_id: "",
          quantity: 1,
          unit_price: 0,
          tax: 0,
          expiry_date: "",
          batch_number: "",
          warehouse_location: "",
        },
      ],
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
  const tax = 0;
  const total = subtotal + tax;

  // Handle product selection - auto-fill unit price
  const handleProductChange = (index: number, productId: string) => {
    const selectedProduct = vendorProducts.find((p: any) => p.product_id === productId);
    if (selectedProduct) {
      form.setValue(`items.${index}.unit_price`, selectedProduct.unit_price || 0);
    }
  };

  // Submit handler
  const onSubmit = async (data: POFormValues) => {
    startTransition(async () => {
      try {
        const result = await createPurchaseOrder({
          vendor_id: data.vendor_id,
          purchase_date: data.purchase_date,
          status: data.PurchaseStatus || "",
          expected_delivery_date: data.expected_delivery_date,
          payment_terms: data.payment_terms,
          note: data.note,
          subtotal,
          tax,
          total_amount: total,
          items: data.items.map((item) => ({
            product_id: item.product_id || "",
            quantity: item.quantity,
            unit_price: item.unit_price,
            expiry_date: item.expiry_date,
            batch_number: item.batch_number,
            warehouse_location: item.warehouse_location,
          })),
        });

        if (result.error) throw new Error(result.error);

        toast.success("Purchase order created successfully");
        form.reset();
        setSelectedVendorId(null);

        // 等待 500ms 确保后端数据完全持久化
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 然后调用成功回调
        onSuccess();
      } catch (error: any) {
        toast.error("Failed to create purchase order", {
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

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* ===== Header with Back Button ===== */}
      <div className="flex items-center justify-between border-b pb-4">
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Back to Purchase Orders"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-xl font-semibold">Create Purchase Order</h1>
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
                {/* Vendor */}
                <FormField
                  control={form.control}
                  name="vendor_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor *</FormLabel>
                      <Select
                        onValueChange={(v) => {
                          const numVal = Number(v);
                          field.onChange(numVal);
                          setSelectedVendorId(numVal);
                        }}
                        value={field.value ? field.value.toString() : ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a vendor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vendors && vendors.length > 0 ? (
                            vendors.map((vendor: any) => (
                              <SelectItem
                                key={vendor.vendor_id}
                                value={vendor.vendor_id.toString()}
                              >
                                {vendor.vendor_name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-sm text-gray-500">
                              No vendors found
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Purchase Date */}
                <FormField
                  control={form.control}
                  name="purchase_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

                <FormField
                  control={form.control}
                  name="PurchaseStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PurchaseStatus</FormLabel>
                      <Select
                        onValueChange={(v) => {
                          field.onChange(v || "");
                        }}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="received">Received</SelectItem>
                          <SelectItem value="partially_received">Partially Received</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
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
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      product_id: "",
                      quantity: 1,
                      unit_price: 0,
                      tax: 0,
                      expiry_date: "",
                      batch_number: "",
                      warehouse_location: "",
                    })
                  } 
                  className="bg-yellow-50 border-2 border-yellow-400 text-yellow-700 hover:bg-amber-500 hover:border-yellow-400  px-3 py-2 font-medium transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No items added. Click "Add Item" to add products.
                </div>
              ) : (
                fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="border rounded-lg p-4 space-y-4 bg-white"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Product - 仅当选择了供应商且有对应产品时显示 */}
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
                                onChange={(e) => field.onChange(Number(e.target.value))}
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
                            <FormLabel>Unit Price *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Tax */}
                      <FormField
                        control={form.control}
                        name={`items.${index}.tax`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tax</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

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

                    {/* Item Total */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-sm font-medium">Item Total:</span>
                      <span className="text-lg font-bold text-blue-600">
                        $
                        {(
                          (form.watch(`items.${index}.quantity`) || 0) *
                          (form.watch(`items.${index}.unit_price`) || 0)
                        ).toFixed(2)}
                      </span>
                    </div>

                    {/* Remove Button */}
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => remove(index)}
                        className="w-full"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Item
                      </Button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span className="text-blue-600">${total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <POFormActions isPending={isPending} onCancel={onCancel} />
        </form>
      </Form>
    </div>
  );
}