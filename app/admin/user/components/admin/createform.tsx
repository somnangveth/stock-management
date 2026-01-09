"use client";
import DialogForm from "@/app/components/dialogform";
import { Button } from "@/components/ui/button";
import MemberForm from "./createmember";
import { btnStyle } from "@/app/components/ui";


export default function CreateForm(){
    return(
        <DialogForm
        id="create-trigger"
        Trigger = {
            <Button
            className={btnStyle}
            >
                + Add New Users
            </Button>
        }
        form = {<MemberForm/>}
        />
    )
}