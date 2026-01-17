'use client';

import DialogForm from "@/app/components/dialogform";
import { btnStyle, edit, EditIconBtn } from "@/app/components/ui";
import { Categories } from "@/type/producttype";
import UpdateCategory from "./updatecategory";
import { Button } from "@/components/ui/button";


export default function UpdateCategoryForm({category}:{category: Categories}){
    return(
        <DialogForm
        id="category-update-trigger"
        title="Update Category"
        Trigger={
            <Button
            className={EditIconBtn}>
                {edit}
            </Button>
        }
        form={<UpdateCategory category = {category as Categories}/>}/>
    )
}