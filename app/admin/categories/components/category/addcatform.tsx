'use client';

import DialogForm from "@/app/components/dialogform";
import AddCategory from "./addcategory";
import { RxPlusCircled } from "react-icons/rx";
import { btnStyle } from "@/app/components/ui";

export default function AddCategoryForm(){
    return(
        <DialogForm
        id="cat-trigger"
        title="Add New Category"
        Trigger={
            <button
            className={btnStyle}>
                <RxPlusCircled/> Category
            </button>
        }
        form={<AddCategory/>}
        />
    )
}