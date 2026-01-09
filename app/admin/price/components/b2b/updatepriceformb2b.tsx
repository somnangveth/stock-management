"use client";

import DialogForm from "@/app/components/dialogform";
import { PriceProductProps } from "../b2c/updateform";
import { Button } from "@/components/ui/button";
import { edit, EditIconBtn } from "@/app/components/ui";
import UpdateSinglePriceB2B from "./updateprice";
import { Price } from "@/type/producttype";

export default function UpdatePriceFormB2B({priceData}:{priceData: Price}){
    return(
        <DialogForm
        id="update-price-b2b"
        title="Update Price B2B"
        Trigger = {
            <Button
            className={EditIconBtn}>
                {edit}
            </Button>
        }
        form = {<UpdateSinglePriceB2B priceData={priceData}/>}/>
    )
}