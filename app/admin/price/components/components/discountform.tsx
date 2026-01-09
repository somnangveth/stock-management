"use client";
import DialogForm from "@/app/components/dialogform";
import { Button } from "@/components/ui/button";
import { Price } from "@/type/producttype";
import DiscountMultiple from "./discountall";
import { btnStyle } from "@/app/components/ui";
import { LuPercent } from "react-icons/lu";
export default function DiscountMultipleForm({ prices }: { prices: Price[] }) {
  return (
    <DialogForm
      id="add-discount"
      title={`Add Discount to ${prices.length} Product(s)`}
      Trigger={
        <Button className={btnStyle}>
          <LuPercent/>Discount
        </Button>
      }
      form={<DiscountMultiple prices={prices} />}
    />
  );
}