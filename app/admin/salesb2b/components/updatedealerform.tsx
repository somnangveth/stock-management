"use client";

import DialogForm from "@/app/components/dialogform";
import { btnStyle, edit, EditIconBtn } from "@/app/components/ui";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import UpdateDealer from "./updatedealer";
import { Dealer } from "@/type/membertype";

export default function UpdateDealerForm({dealer}:{dealer: Dealer}){
    const router = useRouter();

    return(
        <DialogForm
        id="update-dealer"
        title="Update Dealer"
        Trigger={
            <Button
        className={EditIconBtn}>
            {edit}
        </Button>
        }
        form={<UpdateDealer dealer={dealer}/>}/>
    )
}