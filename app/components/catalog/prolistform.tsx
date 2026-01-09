"use client";
import { Product } from "@/type/producttype";
import { useEffect, useState } from "react";
import SelectProductList from "./productlist";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SelectedProductListForm({
  isOpen = false,
  onClose,
  onSelect,
  onSelectMultiple,
  multiple = false,
  selectedProducts = []
}: {
  isOpen?: boolean;
  onClose: () => void;
  onSelect?: (product: Product) => void;
  onSelectMultiple?: (products: Product[]) => void;
  multiple?: boolean;
  selectedProducts?: Product[];
}) {
  const [open, setOpen] = useState(isOpen);

  // Sync external isOpen with internal state
  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {multiple ? "Select Products" : "Select a Product"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-1">
          <SelectProductList
            multiple={multiple}
            onSelect={(product) => {
              // For single selection, call onSelect and close dialog
              if (onSelect) {
                onSelect(product);
                handleClose();
              }
            }}
            onSelectMultiple={onSelectMultiple}
            selectedProducts={selectedProducts}
            onClose={handleClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}