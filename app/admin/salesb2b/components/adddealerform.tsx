"use client";

import { btnStyle } from "@/app/components/ui";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function AddDealerForm(){
    const router = useRouter();

    return(
        <Button
        onClick={() => router.push('/admin/salesb2b/components/adddealer')}
        className={btnStyle}>
            Add Dealer
        </Button>
    )
}