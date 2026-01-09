"use client";

import { getExpiredBatches } from "@/app/functions/admin/stock/expiry/expiry";
import { Product } from "@/type/producttype";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { IsLoading, RetryButton } from "../error/error";
import { useRouter } from "next/navigation";

export default function ExpiryStockPanel(){
    const router = useRouter();

    const {data: expiredBatches, isLoading, error} = useQuery({
        queryKey: ["expiredQuery"],
        queryFn: getExpiredBatches,
    });

      // Calculate expiry count
    const expiryCount = useMemo(() => {
    if(!expiredBatches) return[];

    const expired = expiredBatches.filter((e: Product) => e.alert_type === "expired");
    return expired.length;
    }, [expiredBatches]);

    return(
        <button 
        onClick={() => router.push("/admin/stock/components/expirypanel")}
        className="w-full h-30 border rounded p-3">
            <span className="font-bold text-xl">Expiry Total:</span>

            <div>
            {isLoading && (
            <div className="flex items-center justify-center text-gray-500">
                <IsLoading/>
            </div>
                )
            }
            {error && (
                <RetryButton/>
            )}
            {!isLoading && !error &&(
                <h1 className="text-amber-700 text-5xl flex justify-end">{expiryCount || 0}</h1>
            )}
            </div>
        </button>
    )
}