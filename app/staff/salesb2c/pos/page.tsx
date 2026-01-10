"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ProductCardList from "./components/productcardlist";

export default function POSPage(){
    const router = useRouter();
    const [count, setCount] = useState(1);

    return(
        <div>
            <div>
                <button
                onClick={() => router.back()}
                className="flex items-center gap-2">
                    <ArrowLeft/>
                    Back to main page
                </button>
            </div>
            <ProductCardList/>
        </div>
    )
}