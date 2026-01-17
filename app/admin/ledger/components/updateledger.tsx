// app/admin/ledger/components/update-receipt-form.tsx
"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { toast } from "sonner";
import { EnhancedLedger } from "@/type/membertype";
import { updateLedger, fetchLedgerByVendor } from "../action/ledger";

interface UpdateReceiptFormProps {
  receipt: EnhancedLedger;
  onSuccess?: () => void;
}

export default function UpdateReceiptForm({
  receipt,
  onSuccess,
}: UpdateReceiptFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    defaultValues: {
      vendor_id: receipt.vendor_id,
      source_type: receipt.source_type as "purchase" | "refund",
      debit: Number(receipt.debit) || 0,
      credit: Number(receipt.credit) || 0,
      note: receipt.note || "",
      payment_duedate: receipt.payment_duedate
        ? new Date(receipt.payment_duedate).toISOString().split("T")[0]
        : "",
      payment_status: receipt.payment_status as "paid" | "unpaid" | "partial",
    },
  });

  // Fetch receipt with items
  const { data: receiptDetail } = useQuery({
    queryKey: ["receipt-detail", receipt.ledger_id],
    queryFn: async () => {
      const result = await fetchLedgerByVendor(receipt.vendor_id);
      if (result.error) throw new Error(result.error);
      // 找到当前 receipt 的详细信息（包含 items）
      const found = result.data?.find((l: any) => l.ledger_id === receipt.ledger_id);
      return found;
    },
  });

  // Calculate balance
  const debit = form.watch("debit");
  const credit = form.watch("credit");
  const dueDate = form.watch("payment_duedate");

  const balance = useMemo(() => {
    return Math.max(debit - credit, 0);
  }, [debit, credit]);

  // Calculate days remaining
  const daysRemaining = useMemo(() => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [dueDate]);

  // Get days style
  const getDaysRemainingStyle = (days: number | null) => {
    if (days === null) return "";
    if (days < 0) return "text-red-600 font-semibold";
    if (days <= 7) return "text-orange-600 font-semibold";
    if (days <= 14) return "text-yellow-600 font-semibold";
    return "text-green-600";
  };

  const onSubmit = (data: any) => {
    // Validation
    const numDebit = Number(data.debit);
    const numCredit = Number(data.credit);

    if (numDebit <= 0) {
      toast.error("Total Amount must be greater than 0");
      return;
    }

    if (numCredit < 0) {
      toast.error("Amount Paid cannot be negative");
      return;
    }

    if (numCredit > numDebit) {
      toast.error("Amount Paid cannot exceed Total Amount");
      return;
    }

    startTransition(async () => {
      try {
        // 自动计算付款状态
        const payment_status =
          numCredit === 0
            ? "unpaid"
            : numCredit < numDebit
            ? "partial"
            : "paid";

        console.log("📝 Updating receipt with data:", {
          vendor_id: data.vendor_id,
          source_type: data.source_type,
          debit: numDebit,
          credit: numCredit,
          note: data.note,
          payment_duedate: data.payment_duedate,
          payment_status,
        });

        const result = await updateLedger(receipt.ledger_id, {
          vendor_id: data.vendor_id,
          source_type: data.source_type,
          debit: numDebit,
          credit: numCredit,
          note: data.note || null,
          payment_duedate: data.payment_duedate || null,
          payment_status,
        });

        if (result.error) {
          toast.error("Failed to update receipt", {
            description: result.error,
          });
          return;
        }

        toast.success("Receipt updated successfully");
        setOpen(false);
        form.reset();
        onSuccess?.();
      } catch (err: any) {
        toast.error("Failed to update receipt", {
          description: err?.message,
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
        >
          ✏️
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Receipt</DialogTitle>
          <DialogDescription>
            Update receipt for {receipt.vendor_name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* 0. Receipt Items Display - 显示完整的项目信息 */}
            {receiptDetail?.items && receiptDetail.items.length > 0 && (
              <div className="space-y-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h3 className="font-semibold text-gray-900">Receipt Items</h3>
                <div className="space-y-3">
                  {receiptDetail.items.map((item: any, idx: number) => (
                    <div key={idx} className="p-3 bg-white rounded border space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {item.product_name || "Product"}
                          </p>
                          {item.attribute_value && (
                            <p className="text-xs text-gray-600 mt-1">
                              Spec: {item.attribute_value}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-blue-600">
                            ${item.subtotal?.toFixed(2) || "0.00"}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs text-gray-600 pt-2 border-t">
                        <div>
                          <span className="font-medium">Qty:</span> {item.quantity}
                        </div>
                        <div>
                          <span className="font-medium">Price:</span> ${item.unit_price?.toFixed(2)}
                        </div>
                        <div>
                          <span className="font-medium">SKU:</span> {item.sku_code || "-"}
                        </div>
                        <div>
                          <span className="font-medium">Total:</span> ${item.subtotal?.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* 1. Receipt Information */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Receipt Information</h3>
              
              {/* Vendor */}
              <FormField
                control={form.control}
                name="vendor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor ID *</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Source Type */}
              <FormField
                control={form.control}
                name="source_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="purchase">Purchase</SelectItem>
                          <SelectItem value="refund">Refund</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 2. Payment Information - 完整的费用信息 */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Payment Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Total Amount (应付) */}
                <FormField
                  control={form.control}
                  name="debit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Amount  *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Amount Paid (已付) */}
                <FormField
                  control={form.control}
                  name="credit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Paid</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>



              {/* Payment Summary Box */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-white rounded border border-blue-100">
                    <p className="text-xs text-gray-600 font-medium mb-1">Total</p>
                    <p className="text-lg font-bold text-gray-900">${debit.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Total Amount</p>
                  </div>
                  
                  <div className="text-center p-3 bg-white rounded border border-emerald-100">
                    <p className="text-xs text-gray-600 font-medium mb-1">Credit</p>
                    <p className="text-lg font-bold text-emerald-600">${credit.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Amount Paid</p>
                  </div>
                  
                  <div className="text-center p-3 bg-white rounded border border-orange-100">
                    <p className="text-xs text-gray-600 font-medium mb-1">Debit</p>
                    <p className={`text-lg font-bold ${balance > 0 ? "text-orange-600" : "text-emerald-600"}`}>
                      ${balance.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">Remaining</p>
                  </div>
                </div>
              </div>

              {/* Due Date */}
              <FormField
                control={form.control}
                name="payment_duedate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Days Remaining */}
              {daysRemaining !== null && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-sm flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Days Remaining:</span>
                  <span className={getDaysRemainingStyle(daysRemaining)}>
                    {daysRemaining} days
                  </span>
                </div>
              )}

              {/* Payment Status */}
              <FormField
                control={form.control}
                name="payment_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Status</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="unpaid">Unpaid</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
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
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Add any notes..."
                        rows={3}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  form.reset();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isPending}
                className="bg-blue-50 border-2 border-blue-400 text-blue-700 hover:bg-blue-100 font-medium"
              >
                {isPending ? (
                  <>
                    <AiOutlineLoading3Quarters className="animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  "Update Receipt"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}