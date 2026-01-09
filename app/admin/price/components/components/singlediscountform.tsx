"use client";

import DialogForm from "@/app/components/dialogform";
import { discount } from "@/app/components/ui";
import { Button } from "@/components/ui/button";
import DiscountMultiple from "./discountall";
import { Price } from "@/type/producttype";

export default function SingleDiscountForm({price}:{price: Price}){
    return (
        <DialogForm
        id="add-discount"
        title="Add Discount"
        Trigger ={
            <Button className="bg-yellow-100 rounded-full text-amber-500 hover:text-amber-700 hover:bg-yellow-200">
                {discount}
            </Button>
        }
        form={<DiscountMultiple prices={price}/>}/>
    )
}