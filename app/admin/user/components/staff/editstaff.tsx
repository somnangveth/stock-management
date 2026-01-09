"use client";
import DialogForm from "@/app/components/dialogform";
import { Button } from "@/components/ui/button";
import { Staff } from "@/type/membertype";
import EditForm from "./editform";
import { edit, EditIconBtn } from "@/app/components/ui";

export default function EditStaff({staff}: {staff: Staff}){
    return(
        <DialogForm
        id="update-basic"
        title="Edit Staff Info"
        Trigger ={ 
            <Button
            className={EditIconBtn}
            >
               {edit}
            </Button>
        }

        form = {<EditForm staff={staff}/>}
        />

    )
}