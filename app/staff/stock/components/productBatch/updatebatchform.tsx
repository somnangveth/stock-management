"use client";

import DialogForm from "@/app/components/dialogform";
import { Button } from "@/components/ui/button";
import { Product, ProductBatch } from "@/type/producttype";
import { edit, EditIconBtn, faPlusCircle } from "@/app/components/ui";
import UpdateBatch from "./updatebatch";

export default function UpdateBatchForm({product, batch}:{product: Product, batch: ProductBatch}){
return(
    <DialogForm
    id="update-batch"
    title="Update Batch"
    Trigger={
        <Button className={EditIconBtn}>
            {edit}
        </Button>
    }
    form={<UpdateBatch
         batch={batch}
         product={product}/>}/>
)
}