"use client";

import DialogForm from "@/app/components/dialogform";
import { edit, EditIconBtn } from "@/app/components/ui";
import { Button } from "@/components/ui/button";
import { Attribute } from "@/type/producttype";
import UpdateAttribute from "./updateattribute";

export default function UpdateAttributeForm({attributes}:{attributes: Attribute[]}){
    return(
        <DialogForm
        id="update-attribute"
        title="Update Product Attribute"
        Trigger={
            <Button
            className={EditIconBtn}>
                {edit}
            </Button>
        }
        form={<UpdateAttribute attributes={attributes}/>}/>
    )
}