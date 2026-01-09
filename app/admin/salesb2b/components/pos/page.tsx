"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ProductCardListB2B from "./components/productcardlist";

export default function POSPage(){
    const router = useRouter();

    return(
        <div>
            <div>
                <button
                onClick={() => router.push('/admin/salesb2b')}
                className="flex items-center gap-2">
                    <ArrowLeft/>
                    Back to main page
                </button>
            </div>
            <ProductCardListB2B/>
        </div>
    )
}