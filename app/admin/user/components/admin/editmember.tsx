"use client";
import DialogForm from "@/app/components/dialogform";
import { Button } from "@/components/ui/button";
import { Admin } from "@/type/membertype";
import EditAdmin from "./editform";
import { edit, EditIconBtn } from "@/app/components/ui";

export default function EditMember({admin}: {admin: Admin}){
    return(
        <DialogForm
        id="trigger"
        Trigger = {
            <Button
            className={EditIconBtn}
            >
                {edit}
            </Button>
        }
        form = {<EditAdmin admin={admin}/>}
        />
    )
}