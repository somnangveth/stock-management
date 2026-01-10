"use client";

import { useState } from "react";
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
import { fetchVendors } from "@/app/functions/admin/api/controller";

const UpdateLedgerSchema = z.object({
  vendor_id: z.number().positive("Vendor is required"),
  source_type: z.enum(["purchase", "refund"]),
  debit: z.number().min(0.01, "Total Amount must be greater than 0"),
  credit: z.number().min(0),
  note: z.string().optional(),
  payment_duedate: z.string().optional(),
  payment_status: z.enum(["paid", "unpaid", "partial"]).optional(),
});

type UpdateLedgerValues = z.infer<typeof UpdateLedgerSchema>;

interface UpdateLedgerFormProps {
  ledger: EnhancedLedger;
  onSuccess?: () => void;
}

export default function UpdateLedgerForm({
  ledger,
  onSuccess,
}: UpdateLedgerFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdateLedgerValues>({
    resolver: zodResolver(UpdateLedgerSchema),
    defaultValues: {
      vendor_id: ledger.vendor_id,
      source_type: ledger.source_type,
      debit: ledger.debit,
      credit: ledger.credit,
      note: ledger.note || "",
      payment_duedate: ledger.payment_duedate 
        ? new Date(ledger.payment_duedate).toISOString().split('T')[0]
        : "",
      payment_status: ledger.payment_status as "paid" | "unpaid" | "partial",
    },
  });

  // 获取供应商列表
  const { data: vendors = [] } = useQuery({
    queryKey: ["vendors"],
    queryFn: fetchVendors,
  });

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

        const result = await updateLedger(ledger.ledger_id, {
          ...data,
          vendor_id: data.vendor_id,
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Update Ledger</DialogTitle>
          <DialogDescription>
            Update ledger entry for {ledger.vendor_name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Vendor */}
              <FormField
                control={form.control}
                name="vendor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(v) => field.onChange(Number(v))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {vendors.map((v: any) => (
                            <SelectItem
                              key={v.vendor_id}
                              value={v.vendor_id.toString()}
                            >
                              {v.vendor_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Source Type */}
              <FormField
                control={form.control}
                name="source_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
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
                  </FormItem>
                )}
              />

              {/* Debit */}
              <FormField
                control={form.control}
                name="debit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Credit */}
              <FormField
                control={form.control}
                name="credit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Paid</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

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
                  </FormItem>
                )}
              />

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
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Add any notes..." />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Buttons */}
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
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