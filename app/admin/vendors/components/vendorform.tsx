"use client";
import DialogForm from "@/app/components/dialogform";
import { Button } from "@/components/ui/button";
import CreateVendors from "./createvendor";
import { btnStyle, plusCircle } from "@/app/components/ui";
import { Plus } from "lucide-react";

export default function VendorForm({
    onVendorAdded
}:{
    onVendorAdded?: () => void
}){
    return(
        <DialogForm
        id="vendor-trigger"
        Trigger ={
            <button
            className={btnStyle}>
                <Plus className="h-4 w-4 mr-2"/>
                Add Vendors
            </button>
        }
        form={<CreateVendors onSuccess={onVendorAdded}/>}
        />
    )
}
