"use client";

import { useState, useTransition } from "react";
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
import { btnStyle, DeleteBtn, DeleteIconBtn, trash } from "@/app/components/ui";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { toast } from "sonner";
import { deleteLedger } from "../action/ledger";
import {Button} from "@/components/ui/button";

interface DeleteLedgerProps {
  ledger_id: string;
  vendor_name: string;
  onSuccess?: () => void;
}

export default function DeleteLedger({
  ledger_id,
  vendor_name,
  onSuccess,
}: DeleteLedgerProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteLedger(ledger_id);

        if (result.error) {
          toast.error("Failed to delete ledger", {
            description: result.error,
          });
          return;
        }

        toast.success("Ledger deleted successfully");
        setOpen(false);
        onSuccess?.();
      } catch (err: any) {
        toast.error("Failed to delete ledger", {
          description: err?.message,
        });
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={DeleteIconBtn}
        >
          {trash}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Ledger Entry</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this ledger entry for{" "}
            <strong>{vendor_name}</strong>? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-2 justify-end">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending ? (
              <>
                <AiOutlineLoading3Quarters className="animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
