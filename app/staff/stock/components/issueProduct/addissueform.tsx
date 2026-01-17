"use client";
import DialogForm from "@/app/components/dialogform";
import { DeleteIconBtn, questionMark } from "@/app/components/ui";
import { Button } from "@/components/ui/button";
import { Price, Product, ProductBatch, StockAlert } from "@/type/producttype";
import AddIssueProduct from "./addissue";
import { useState } from "react";

export default function AddIssueProductForm({
  batch,
  product,
  stockAlert,
  price,
}: {
  batch: ProductBatch;
  product: Product;
  stockAlert: StockAlert;
  price: Price[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <DialogForm
      id="add-issue"
      title="Add Issue Product"
      Trigger={
        <Button className={DeleteIconBtn}>
          {questionMark}
        </Button>
      }
      form={
        <AddIssueProduct 
          product={product}
          batch={batch}
          stockAlert={stockAlert}
          price={price}
        />
      }
    />
  );
}