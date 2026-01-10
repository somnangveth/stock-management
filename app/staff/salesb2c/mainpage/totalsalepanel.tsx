"use client";

import { IsLoading, RetryButton } from "@/app/components/error/error";
import { fetchSales } from "@/app/functions/admin/api/controller";
import { Sale } from "@/type/producttype";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export default function SaleTotalPanel(){
    const {data, isLoading, error} = useQuery({
        queryKey: ["saleQuery"],
        queryFn: fetchSales,
    });

    //Total Sales with customertype = "General"
    const totalSale = useMemo(() => {
        if(!data) return[];
        return data.filter((sale: Sale) => sale.customertype === "General");
    }, [data]);

    //Filter Sale Table which process_status === "draft"
    const draftedSales = useMemo(() => {
        if(!data) return[];
        return data.filter((sale: Sale) => sale.process_status === "draft" && sale.customertype === "General");
    }, [data]);

    //Filter Sale Table which process_status === completed
    const completedSales = useMemo(() => {
        if(!data) return[];
        return data.filter((sale: Sale) => sale.process_status === "completed" && sale.customertype === "General");
    }, [data]);

        const totalCount = totalSale.length;
        const draftedCount = draftedSales.length;
        const completedCount = completedSales.length;

        return(
            <div>
                    {isLoading && (
                        <IsLoading/>
                    )}
                    {error && (
                        <RetryButton/>
                    )}
            
                    {!isLoading && !error && (
                        <div className="flex w-full gap-3">
                            {/* Total */}
                        <div className="w-1/3 h-30 p-3 border border-gray-500 rounded-lg">
                        <div className="flex justify-between">
                            <span className="font-semibold">Total:</span>
                            <h1 className="flex items-end text-5xl">{totalCount}</h1>
                        </div>
                        </div>
                        {/* Draft */}
                        <div className="w-1/3 h-30 p-3 border border-gray-500 rounded-lg">
                        <div className="flex justify-between">
                            <span className="font-semibold">Draft:</span>
                            <h1 className="flex items-end text-5xl">{draftedCount}</h1>
                        </div>
                        </div>

                        {/* Completed */}
                        <div className="w-1/3 h-30 p-3 border border-gray-500 rounded-lg">
                        <div className="flex justify-between">
                            <span className="font-semibold">Completed:</span>
                            <h1 className="flex items-end text-5xl text-green-700">{completedCount}</h1>
                        </div>
                        </div>
                        </div>
                    )}
                    </div>
        )
}