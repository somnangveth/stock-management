"use client";
import ReceiptCard, { SaleItem } from "@/app/components/catalog/receiptcard";
import DialogForm from "@/app/components/dialogform";
import { EditIconBtn, view } from "@/app/components/ui";
import { Button } from "@/components/ui/button";
import { Product, Sale } from "@/type/producttype";

interface ReceiptB2CProps {
  sale: Sale & {
    items: SaleItem[];
    itemCount: number;
  };
  product: Product;
}

export default function ReceiptB2C({ sale,  product}: ReceiptB2CProps) {
  return (
    <DialogForm
      style="bg-white/50 backdrop-blur-sm"
      id={`receipt-${sale.sale_id}`}
      Trigger={
        <Button className="bg-yellow-100 hover:bg-yellow-200 text-amber-700 rounded-full">
          {view}
        </Button>
      }
      form={
        <ReceiptCard 
          saleData={sale} 
          productData={product} 
          saleItemData={sale.items}
        />
      }
    />
  );
}