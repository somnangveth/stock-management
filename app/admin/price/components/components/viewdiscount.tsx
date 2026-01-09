"use client";

import { btnStyle, view } from "@/app/components/ui";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ViewDiscountPage(){
    const router = useRouter();
    return(
        <Button
        className={btnStyle}
        onClick={() => router.push("/admin/price/components/components/discountdetail")}>
            {view}View Discounts
        </Button>
    )
}