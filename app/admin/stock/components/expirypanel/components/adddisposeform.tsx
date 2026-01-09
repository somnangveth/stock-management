"use client";

import DialogForm from "@/app/components/dialogform";
import { SubmitBtn } from "@/app/components/ui";
import { Button } from "@/components/ui/button";
import { ExpiredProductDisposal } from "@/type/producttype";
import AddDispose from "./adddispose";

export default function DisposeForm({dispose}:{dispose: ExpiredProductDisposal}){
    return(
        <DialogForm
        id="add-disposed"
        title="Dispose Product"
        Trigger = {
        <Button
        className={SubmitBtn}>
            Dispose
        </Button>}
        form={<AddDispose dispose={dispose}/>}/>
    )
}