
// app/admin/ledger/components/receipt-form.tsx
"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { useTransition, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createLedger } from "../action/ledger";
import { fetchVendors } from "@/app/functions/admin/api/controller";
import { fetchProductByVendor } from "@/app/functions/admin/stock/product/vendor";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2, Receipt, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { btnStyle } from "@/app/components/ui";

interface ReceiptFormProps {
  onReceiptAdded?: () => void;
}

export default function ReceiptForm({ onReceiptAdded }: ReceiptFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);

  const { data: vendors = [], isLoading: vendorsLoading } = useQuery({
    queryKey: ["vendors"],
    queryFn: fetchVendors,
  });

  // ✅ 根据选中的 vendor 获取产品
  const { data: vendorProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products", selectedVendorId],
    queryFn: () => fetchProductByVendor(selectedVendorId!),
    enabled: !!selectedVendorId, // 只有选了 vendor 才查询
  });

  const form = useForm({
    defaultValues: {
      vendor_id: "",
      receipt_number: "",
      receipt_date: new Date().toISOString().split("T")[0],
      payment_duedate: "",
      payment_status: "pending",
      note: "",
      amount_paid: 0,
      items: [
        {
          product_id: "",
          quantity: 1,
          unit_price: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const items = form.watch("items");
  const amountPaid = Number(form.watch("amount_paid") || 0);

  const subtotal = items.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.unit_price || 0);
  }, 0);
  const total = subtotal;
  const remaining = total - amountPaid;

  const getProductAttributes = (productId: string | undefined) => {
    if (!productId) return [];
    const product = vendorProducts.find((p: any) => p.product_id === productId);
  };

  const handleProductChange = (index: number, productId: string) => {
    const selectedProduct = vendorProducts.find((p: any) => p.product_id === productId);
    if (selectedProduct) {
      form.setValue(`items.${index}.unit_price`, 0);
    }
  };

  const daysRemaining = useMemo(() => {
    const receiptDate = form.watch("receipt_date");
    const dueDate = form.watch("payment_duedate");

    if (!receiptDate || !dueDate) return null;

    const created = new Date(receiptDate);
    const due = new Date(dueDate);
    const diffTime = due.getTime() - created.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [form.watch("receipt_date"), form.watch("payment_duedate")]);

  const getDaysRemainingStyle = (days: number | null) => {
    if (days === null) return "";
    if (days < 0) return "text-red-600 font-semibold";
    if (days <= 7) return "text-orange-600 font-semibold";
    if (days <= 14) return "text-yellow-600 font-semibold";
    return "text-green-600";
  };

  const onSubmit = (data: any) => {
    // Validate vendor
    const vendorId = Number(data.vendor_id);
    if (!vendorId || isNaN(vendorId) || vendorId <= 0) {
      toast.error("Please select a valid vendor");
      return;
    }

    // Validate receipt number
    if (!data.receipt_number || data.receipt_number.trim() === "") {
      toast.error("Receipt number is required");
      return;
    }

    // Validate receipt date
    if (!data.receipt_date || data.receipt_date.trim() === "") {
      toast.error("Receipt date is required");
      return;
    }

    // Validate items
    if (!data.items || data.items.length === 0) {
      toast.error("At least one item is required");
      return;
    }

    for (const item of data.items) {
      if (Number(item.quantity || 0) < 1) {
        toast.error("Quantity must be at least 1");
        return;
      }
      if (Number(item.unit_price || 0) < 0.01) {
        toast.error("Unit price must be greater than 0");
        return;
      }
    }

    // Validate amounts
    if (amountPaid > total) {
      toast.error("Amount Paid cannot exceed Total Amount");
      return;
    }

    const ledgerPayload = {
      vendor_id: vendorId,
      source_type: "purchase",
      product_id: null,
      debit: subtotal,
      credit: amountPaid,
      note: data.note || `Receipt: ${data.receipt_number}`,
      created_at: data.receipt_date,
      payment_duedate: data.payment_duedate || null,
      payment_status: data.payment_status,
      items: data.items.map((item: any) => ({
        product_id: item.product_id || null,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
      })),
    };

    startTransition(async () => {
      try {
        await createLedger(ledgerPayload);
        toast.success("Receipt created successfully!");
        form.reset();
        setSelectedVendorId(null);
        setOpen(false);
        onReceiptAdded?.();
      } catch (e: any) {
        toast.error("Failed to create receipt", {
          description: e.message || "Unknown error",
        });
      }
    });
  };

  const isDataLoading = vendorsLoading;

  if (isDataLoading) {
    return (
      <Button className="bg-amber-50 border-2 border-yellow-400 text-amber-700 hover:bg-yellow-100 font-medium" disabled>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Loading...
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={btnStyle}>
          <Plus className="h-4 w-4 mr-2" />
          Create Receipt
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[95vw] max-w-5xl max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <Receipt className="h-6 w-6 text-amber-600" />
            <DialogTitle>Create Receipt</DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 1. Receipt Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Receipt Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border">
                  <FormField
                    control={form.control}
                    name="receipt_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Receipt Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., RCP-2024-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />


                  <FormField
                    control={form.control}
                    name="receipt_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Receipt Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vendor_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Vendor *</FormLabel>
                        <Select
                          onValueChange={(v) => {
                            const numVal = Number(v);
                            field.onChange(v);
                            setSelectedVendorId(numVal);
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select vendor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {vendors?.length > 0 ? (
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
                </div>
              </div>

              {/* 2. Receipt Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Receipt Items</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({
                        product_id: "",
                        quantity: 1,
                        unit_price: 0,
                      })
                    }
                    className="bg-yellow-50 border-2 border-yellow-400 text-yellow-700 hover:bg-yellow-100 text-xs"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>



                <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                  {fields.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No items added yet
                    </div>
                  ) : (
                    fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="p-4 bg-white rounded-lg border space-y-3"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* 产品选择 */}
                          {selectedVendorId ? (
                            <>
                              {productsLoading ? (
                                <div className="p-2 bg-blue-50 rounded border border-blue-200">
                                  <p className="text-xs text-blue-600 font-medium">
                                    ⏳ Loading products...
                                  </p>
                                </div>
                              ) : vendorProducts.length > 0 ? (
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.product_id`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs">Product *</FormLabel>
                                      <Select
                                        onValueChange={(v) => {
                                          field.onChange(v || "");
                                          handleProductChange(index, v);
                                        }}
                                        value={field.value || ""}
                                      >
                                        <FormControl>
                                          <SelectTrigger className="h-9 text-sm">
                                            <SelectValue placeholder="Select" />
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
                              ) : (
                                <div className="p-2 bg-red-50 rounded border border-red-200">
                                  <p className="text-xs text-red-600 font-medium">
                                    ❌ No products found
                                  </p>
                                  <p className="text-xs text-red-500 mt-1">
                                    This vendor has no associated products
                                  </p>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
                              <p className="text-xs text-yellow-700 font-medium">
                                ⚠️ Please select a vendor first
                              </p>
                            </div>
                          )}



                          <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Qty *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="1"
                                    step="1"
                                    className="h-9 text-sm"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`items.${index}.unit_price`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Price *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    className="h-9 text-sm"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-xs text-gray-600">
                            Total: $
                            {(
                              (form.watch(`items.${index}.quantity`) || 0) *
                              (form.watch(`items.${index}.unit_price`) || 0)
                            ).toFixed(2)}
                          </span>
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                              className="text-red-600 hover:text-red-700 h-8"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 3. Payment Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Payment Information</h3>

                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-white rounded border border-blue-100">
                      <p className="text-xs text-gray-600 font-medium mb-1">Total</p>
                      <p className="text-lg font-bold text-gray-900">
                        ${total.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">Total Amount</p>
                    </div>



                    <div className="text-center p-3 bg-white rounded border border-emerald-100">
                      <p className="text-xs text-gray-600 font-medium mb-1">
                        Credit
                      </p>
                      <p className="text-lg font-bold text-emerald-600">
                        ${amountPaid.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">Amount Paid</p>
                    </div>

                    <div className="text-center p-3 bg-white rounded border border-orange-100">
                      <p className="text-xs text-gray-600 font-medium mb-1">
                        Debit
                      </p>
                      <p
                        className={`text-lg font-bold ${
                          remaining > 0 ? "text-orange-600" : "text-emerald-600"
                        }`}
                      >
                        ${remaining.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">Remaining</p>
                    </div>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="amount_paid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Paid</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max={total}
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-gray-500">
                        Max: ${total.toFixed(2)}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payment_duedate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {daysRemaining !== null && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-sm flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Days Remaining:</span>
                    <span className={getDaysRemainingStyle(daysRemaining)}>
                      {daysRemaining} days
                    </span>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="payment_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="refunded">Refunded</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>



              {/* 4. Notes */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Additional Information</h3>
                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add notes..."
                          rows={2}
                          className="text-sm resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 px-6 py-4 border-t bg-gray-50 shrink-0">
          <Button
            type="submit"
            onClick={() => form.handleSubmit(onSubmit)()}
            className="flex-1 bg-green-50 border-2 border-green-400 text-green-700 hover:bg-green-100 font-medium"
            disabled={isPending || !selectedVendorId}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isPending ? "Creating..." : "Create Receipt"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setOpen(false);
              form.reset();
              setSelectedVendorId(null);
            }}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}