'use client';
import DialogForm from "@/app/components/dialogform";
import { Button } from "@/components/ui/button";
import { ProductBatch } from "@/type/producttype";
import { PackagePlus } from "lucide-react";
import AddStockInForm from "./stockinform";

type Props = {
  batch: ProductBatch;
};

export default function StockInDialogForm({ batch }: Props) {
  return (
    <DialogForm
      id="stock-in-batch" 
      title="Add Stock In"
      Trigger={
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2 hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition-colors"
        >
          <PackagePlus className="h-4 w-4" />
          Stock In
        </Button>
      }
      form={
        <AddStockInForm batch={batch}/>
      }
    />
  );
}