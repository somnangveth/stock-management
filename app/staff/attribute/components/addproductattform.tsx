"use client";

import DialogForm from "@/app/components/dialogform";
import { edit, EditIconBtn } from "@/app/components/ui";
import AddProductAttribute from "./addproductattribute";

export default function UpdateAttributeForm(){
    return(
        <DialogForm
            id="update-trigger"
            title="Update Product"
            Trigger={
                <button
                    className={EditIconBtn}>
                    {edit}
                </button>
            }
            form = {<AddProductAttribute/>}
        />
    )
}