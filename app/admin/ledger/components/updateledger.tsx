// app/admin/ledger/components/update-ledger-form.tsx
"use client";

import { useState, useMemo } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { updateLedger } from "../action/ledger";
import { fetchPurchaseOrders } from "../../purchase/action/purchaseorder";
import { PurchaseOrder } from "@/type/producttype";

const UpdateLedgerSchema = z
  .object({
    purchase_id: z.string().optional(),
    vendor_id: z.number().positive("Vendor is required"),
    source_type: z.enum(["purchase", "refund"]),
    debit: z.number().positive("Total Amount must be greater than 0"),
    credit: z.number().nonnegative("Credit cannot be negative"),
    note: z.string().optional(),
    payment_duedate: z.string().optional(),
    payment_status: z.enum(["paid", "unpaid", "partial"]).optional(),
  })
  .refine((data) => data.credit <= data.debit, {
    message: "Amount Paid cannot exceed Total Amount",
    path: ["credit"],
  });

type UpdateLedgerValues = z.infer<typeof UpdateLedgerSchema>;

interface UpdateLedgerFormProps {
  ledger: EnhancedLedger;
  onSuccess?: () => void;
}

export default function UpdateLedger({
  ledger,
  onSuccess,
}: UpdateLedgerFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);

  const form = useForm<UpdateLedgerValues>({
    resolver: zodResolver(UpdateLedgerSchema),
    defaultValues: {
      purchase_id: "",
      vendor_id: ledger.vendor_id,
      source_type: ledger.source_type as "purchase" | "refund",
      debit: Number(ledger.debit) || 0,
      credit: Number(ledger.credit) || 0,
      note: ledger.note || "",
      payment_duedate: ledger.payment_duedate
        ? new Date(ledger.payment_duedate).toISOString().split("T")[0]
        : "",
      payment_status: ledger.payment_status as "paid" | "unpaid" | "partial",
    },
  });

  // Fetch purchase orders
  const { data: purchaseOrders = [], isLoading: poLoading } = useQuery<
    PurchaseOrder[]
  >({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const result = await fetchPurchaseOrders();
      if (result.error) throw new Error(result.error);
      return result.data || [];
    },
  });

  // Get selected purchase
  const selectedPurchase = useMemo(() => {
    if (!selectedPurchaseId) return null;
    return purchaseOrders.find((po) => po.purchase_id === selectedPurchaseId);
  }, [selectedPurchaseId, purchaseOrders]);

  // Handle purchase selection
  const handlePurchaseChange = (poId: string) => {
    const po = purchaseOrders.find((p) => p.purchase_id === poId);
    if (po) {
      setSelectedPurchaseId(poId);
      form.setValue("purchase_id", poId);
      form.setValue("vendor_id", po.vendor_id);
      form.setValue("debit", po.total_amount);
      form.setValue("credit", 0);
      form.setValue("source_type", "purchase");
      form.setValue("note", `From Purchase Order: ${po.po_number}`);
    }
  };

  // Calculate balance
  const debit = form.watch("debit");
  const credit = form.watch("credit");
  const dueDate = form.watch("payment_duedate");
  const purchaseId = form.watch("purchase_id");


  const balance = useMemo(() => {
    return Math.max(debit - credit, 0);
  }, [debit, credit]);

  // Calculate days remaining
  const daysRemaining = useMemo(() => {
    if (!selectedPurchase || !dueDate) return null;
    const created = new Date(selectedPurchase.purchase_date);
    const due = new Date(dueDate);
    const diffTime = due.getTime() - created.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [selectedPurchase, dueDate]);

  // Get days style
  const getDaysRemainingStyle = (days: number | null) => {
    if (days === null) return "";
    if (days < 0) return "text-red-600 font-semibold";
    if (days <= 7) return "text-orange-600 font-semibold";
    if (days <= 14) return "text-yellow-600 font-semibold";
    return "text-green-600";
  };

  const onSubmit = (data: UpdateLedgerValues) => {
    startTransition(async () => {
      try {
        // 自动计算付款状态
        const payment_status =
          data.credit === 0
            ? "unpaid"
            : data.credit < data.debit
            ? "partial"
            : "paid";

        console.log("📝 Updating ledger with data:", {
          vendor_id: data.vendor_id,
          source_type: data.source_type,
          debit: data.debit,
          credit: data.credit,
          note: data.note,
          payment_duedate: data.payment_duedate,
          payment_status,
        });

        const result = await updateLedger(ledger.ledger_id, {
          vendor_id: data.vendor_id,
          source_type: data.source_type,
          debit: data.debit,
          credit: data.credit,
          note: data.note || null,
          payment_duedate: data.payment_duedate || null,
          payment_status,
        });

        if (result.error) {
          toast.error("Failed to update ledger", {
            description: result.error,
          });
          return;
        }

        toast.success("Ledger updated successfully");
        setOpen(false);
        form.reset();
        setSelectedPurchaseId(null);
        onSuccess?.();
      } catch (err: any) {
        toast.error("Failed to update ledger", {
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Ledger</DialogTitle>
          <DialogDescription>
            Update ledger entry for {ledger.vendor_name}
          </DialogDescription>
        </DialogHeader>


        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Purchase Order Selection (Optional) */}
            <FormField
              control={form.control}
              name="purchase_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Update from Purchase Order (Optional)</FormLabel>
                  <Select
                    onValueChange={handlePurchaseChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a purchase order to auto-fill" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__clear__">Clear Selection</SelectItem>
                      {!poLoading && purchaseOrders.map((po) => (
                        <SelectItem key={po.purchase_id} value={po.purchase_id}>
                          {po.po_number} - {po.vendor_name} ($
                          {po.total_amount.toFixed(2)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {/* Purchase Details */}
            {selectedPurchase && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-gray-600 text-xs font-medium">PO Number</p>
                    <p className="font-semibold text-gray-900">
                      {selectedPurchase.po_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs font-medium">Vendor</p>
                    <p className="font-semibold text-gray-900">
                      {selectedPurchase.vendor_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs font-medium">Amount</p>
                    <p className="font-semibold text-blue-600">
                      ${selectedPurchase.total_amount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs font-medium">Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedPurchase.purchase_date).toLocaleDateString(
                        "en-US"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

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

Jade peakz, [9/1/26 15:27 ]


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

            <div className="grid grid-cols-2 gap-4">
              {/* Debit */}
              <FormField
                control={form.control}
                name="debit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Amount (应付) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Credit */}
              <FormField
                control={form.control}
                name="credit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Paid (已付)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-sm flex justify-between">
                <span className="text-gray-600">Days Remaining:</span>
                <span className={getDaysRemainingStyle(daysRemaining)}>
                  {daysRemaining} days
                </span>
              </div>
            )}

            {/* Balance */}
            <div className="p-3 bg-slate-100 rounded-md border border-slate-300 text-sm flex justify-between">
              <span className="text-gray-700 font-medium">
                Remaining Balance (欠款):
              </span>
              <span
                className={`font-bold text-lg ${
                  balance > 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                ${balance.toFixed(2)}
              </span>
            </div>

Jade peakz, [9/1/26 15:27 ]


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

            {/* Note */}
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Buttons */}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  setSelectedPurchaseId(null);
                  form.reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <AiOutlineLoading3Quarters className="animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  "Update Ledger"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}