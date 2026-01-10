"use client";

import DialogForm from "@/app/components/dialogform";
import { edit } from "@/app/components/ui";
import { Button } from "@/components/ui/button";
import { Subcategories } from "@/type/producttype";
import UpdateSubcategory from "./updatesubcategory";

export default function UpdateSubForm({subcategory}:{subcategory: Subcategories}){
    return(
        <DialogForm
        id="sub-update"
        title="Update Subcategory"
        Trigger={
            <Button
            className="bg-transparent hover:bg-transparent text-blue-500 hover:text-blue-700">
                {edit}
            </Button>
        }
        form={<UpdateSubcategory subcategory={subcategory}/>}/>
    )
}