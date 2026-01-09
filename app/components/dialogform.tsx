"use client";
import { 
    Dialog,
    DialogHeader,
    DialogContent,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { ReactNode } from "react";

export default function DialogForm({
    Trigger,
    id,
    title,
    style,
    form,
}: {
    title?: string,
    id: string,
    style?: string;
    form: ReactNode,
    Trigger: ReactNode,
}){
    return(
        <Dialog>
            <DialogTrigger asChild id={id}>
                {Trigger}
            </DialogTrigger>
            <DialogContent className={style}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                {form}
            </DialogContent>
        </Dialog>
    )
}