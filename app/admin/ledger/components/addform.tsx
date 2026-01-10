"use client";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTransition, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createLedger } from "../action/ledger";
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
import { btnStyle } from "@/app/components/ui";
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
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { PurchaseOrder } from "@/type/producttype";
import { Button } from "@/components/ui/button";
import { fetchPurchaseOrders } from "../../purchase/action/purchaseorder";

/* ================= Schema ================= */

const LedgerFromPurchaseSchema = z
  .object({
    purchase_id: z.string().min(1, "Please select a purchase order"),
    debit: z.number().min(0.01, "Amount must be greater than 0"),
    credit: z.number().min(0),
    payment_duedate: z.string().optional(),
    payment_status: z.enum(["paid", "unpaid", "partial"]),
    note: z.string().optional(),
  })
  .refine((data) => data.credit <= data.debit, {
    message: "Amount Paid cannot exceed Total Amount",
    path: ["credit"],
  });

type LedgerFromPurchaseValues = z.infer<typeof LedgerFromPurchaseSchema>;

interface LedgerFromPurchaseProps {
  onLedgerAdded?: () => void;
  onSuccess?:() => void;
}

/* ================= Component ================= */

export default function LedgerFromPurchase({
  onSuccess,
  onLedgerAdded,
}: LedgerFromPurchaseProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  /* -------- Fetch Purchase Orders -------- */
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

  /* -------- Form -------- */
  const form = useForm<LedgerFromPurchaseValues>({
    resolver: zodResolver(LedgerFromPurchaseSchema),
    defaultValues: {
      purchase_id: "",
      debit: 0,
      credit: 0,
      payment_duedate: "",
      payment_status: "unpaid",
      note: "",
    },
  });

  /* -------- Watches -------- */
  const purchaseId = form.watch("purchase_id");
  const debit = form.watch("debit");
  const credit = form.watch("credit");
  const dueDate = form.watch("payment_duedate");

  /* -------- Get Selected Purchase -------- */
  const selectedPurchase = useMemo(() => {
    if (!purchaseId) return null;
    return purchaseOrders.find((po) => po.purchase_id === purchaseId);
  }, [purchaseId, purchaseOrders]);

  /* -------- Auto-fill from Purchase -------- */
  const handlePurchaseChange = (poId: string) => {
    const po = purchaseOrders.find((p) => p.purchase_id === poId);
    if (po) {
      setSelectedPurchaseId(poId);
      form.setValue("purchase_id", poId);
      form.setValue("debit", po.total_amount);
      form.setValue("credit", 0);
      form.setValue("note", `From Purchase Order: ${po.po_number}`);
      setError(null);
    }
  };

  /* -------- Balance -------- */
  const balance = useMemo(() => {
    return Math.max(debit - credit, 0);
  }, [debit, credit]);

  /* -------- Days Remaining -------- */
  const daysRemaining = useMemo(() => {
    if (!selectedPurchase || !dueDate) return null;


    const created = new Date(selectedPurchase.purchase_date);
    const due = new Date(dueDate);

    const diffTime = due.getTime() - created.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [selectedPurchase, dueDate]);

  /* -------- Days Style -------- */
  const getDaysRemainingStyle = (days: number | null) => {
    if (days === null) return "";
    if (days < 0) return "text-red-600 font-semibold";
    if (days <= 7) return "text-orange-600 font-semibold";
    if (days <= 14) return "text-yellow-600 font-semibold";
    return "text-green-600";
  };

  /* -------- Submit -------- */
  const onSubmit = (data: LedgerFromPurchaseValues) => {
    if (!selectedPurchase) {
      setError("Please select a purchase order");
      toast.error("Please select a purchase order");
      return;
    }

    console.log("🔍 Selected Purchase:", selectedPurchase);
    console.log("🔍 vendor_id type:", typeof selectedPurchase.vendor_id);
    console.log("🔍 vendor_id value:", selectedPurchase.vendor_id);

    // 确定支付状态
    const paymentStatus =
      data.credit === 0
        ? "unpaid"
        : data.credit < data.debit
        ? "partial"
        : "paid";

    const ledgerPayload = {
      vendor_id: Number(selectedPurchase.vendor_id), // 确保是数字
      source_type: "purchase",
      product_id: null,
      debit: Number(data.debit),
      credit: Number(data.credit),
      note: data.note || `From Purchase Order: ${selectedPurchase.po_number}`,
      created_at: selectedPurchase.purchase_date,
      payment_duedate: data.payment_duedate || null,
      payment_status: paymentStatus,
    };

    console.log("📝 Creating ledger with payload:", ledgerPayload);

    startTransition(async () => {
      try {
        const result = await createLedger(ledgerPayload);

        console.log("✅ Ledger created:", result);

        toast.success("Ledger entry created successfully!");
        form.reset();
        setSelectedPurchaseId(null);
        setError(null);
        setOpen(false);
        onLedgerAdded?.();
        onSuccess?.();
      } catch (e: any) {
        console.error("❌ Error creating ledger:", e);
        const errorMsg = e.message || "Unknown error";
        setError(errorMsg);
        toast.error("Failed to create ledger", {
          description: errorMsg,
        });
      }
    });
  };

  const isLoading = poLoading;

  /* ================= UI ================= */

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className=" bg-yellow-50 border-2 border-yellow-400 text-yellow-700 hover:bg-amber-400 hover:border-yellow-400 font-medium transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          Create Ledger from PO
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Ledger from Purchase Order</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-red-800 mt-1">{error}</p>
            </div>
          </div>
        )}

Jade peakz, [9/1/26 14:47 ]


        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading purchase orders...</span>
          </div>
        ) : purchaseOrders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No purchase orders available</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Purchase Order Selection */}
              <FormField
                control={form.control}
                name="purchase_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Order *</FormLabel>
                    <Select
                      onValueChange={handlePurchaseChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a purchase order" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {purchaseOrders.map((po) => (
                          <SelectItem key={po.purchase_id} value={po.purchase_id}>
                            {po.po_number} - {po.vendor_name} ($
                            {po.total_amount.toFixed(2)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Purchase Details */}
              {selectedPurchase && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-gray-600 text-xs font-medium">PO Number</p>
                      <p className="font-semibold text-gray-900">
                        {selectedPurchase.po_number}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs font-medium">Vendor ID</p>
                      <p className="font-semibold text-gray-900">
                        {selectedPurchase.vendor_id}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs font-medium">Vendor Name</p>
                      <p className="font-semibold text-gray-900">
                        {selectedPurchase.vendor_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs font-medium">Total Amount</p>
                      <p className="font-semibold text-blue-600">
                        ${selectedPurchase.total_amount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs font-medium">Purchase Date</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(selectedPurchase.purchase_date).toLocaleDateString(
                          "en-US"
                        )}
                      </p>
                    </div>
                    {selectedPurchase.expected_delivery_date && (
                      <div>
                        <p className="text-gray-600 text-xs font-medium">
                          Expected Delivery
                        </p>
                        <p className="font-semibold text-gray-900">
                          {new Date(
                            selectedPurchase.expected_delivery_date
                          ).toLocaleDateString("en-US")}
                        </p>
                      </div>
                    )}

Jade peakz, [9/1/26 14:47 ]

                  </div>
                </div>
              )}

              {/* Debit (Total Amount) */}
              <FormField
                control={form.control}
                name="debit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Amount *</FormLabel>
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

              {/* Credit (Amount Paid) */}
              <FormField
                control={form.control}
                name="credit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Paid </FormLabel>
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

              {/* Due Date */}
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
                  Remaining Balance :
                </span>
                <span
                  className={`font-bold text-lg ${
                    balance > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  ${balance.toFixed(2)}
                </span>
              </div>

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
                        placeholder="Add any notes about this ledger entry..."
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />


              <div className="flex gap-2 pt-4">
                 <Button
                  type="submit"
                  className="flex-1 bg-yellow-50 border-2 border-yellow-400 text-yellow-700 hover:bg-amber-400 hover:border-yellow-400 font-medium transition-colors"
                  disabled={isPending || !selectedPurchase}
                >
                  {isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {isPending ? "Creating..." : "Create Ledger Entry"}
                </Button>
                 <Button  
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    setError(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}