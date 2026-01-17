// app/admin/ledger/components/delete-receipt.tsx
"use client";

import { useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteLedger } from "../action/ledger";

interface DeleteReceiptProps {
  receipt_id: string;
  vendor_name: string;
  onSuccess?: () => void;
}

export default function DeleteReceipt({
  receipt_id,
  vendor_name,
  onSuccess,
}: DeleteReceiptProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteLedger(receipt_id);

        if (result.error) {
          toast.error("Failed to delete receipt", {
            description: result.error,
          });
          return;
        }

        toast.success("Receipt deleted successfully");
        onSuccess?.();
      } catch (err: any) {
        toast.error("Failed to delete receipt", {
          description: err?.message,
        });
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Receipt</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this receipt from{" "}
            <span className="font-semibold text-slate-900">{vendor_name}</span>?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 justify-end">
          <AlertDialogCancel disabled={isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
