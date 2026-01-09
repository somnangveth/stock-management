'use client';

import DialogForm from "@/app/components/dialogform";
import { Button } from "@/components/ui/button";
import AddSubcategory from "./addsubcategory";
import { RxPlusCircled } from "react-icons/rx";
import { btnStyle } from "@/app/components/ui";

export default function AddSubcategoryForm(){
    return(
        <DialogForm
        id="create-sub-trigger"
        title="Create Subcategory"
        Trigger={
            <button
            className={btnStyle}>
                <RxPlusCircled/> Subcategory
            </button>
        }
        form={<AddSubcategory/>}/>
    )
}