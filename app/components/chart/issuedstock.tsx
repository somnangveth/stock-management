"use client";

import { useQuery } from "@tanstack/react-query";

async function fetchStockMovement() {
    const res = await fetch("/api/admin/fetchstockmovement");

    if (!res.ok) {
        throw new Error("Failed to fetch stock movement");
    }

    return res.json(); // must return an array
}

export default function IssuedStockPanel() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ["fetchstockmovement"],
        queryFn: fetchStockMovement,
    });

    const issuedTotal = Array.isArray(data) ? data.length : 0;

    return (
        <div className="w-full h-30 border rounded p-3">
            <span className="font-bold text-xl">Issued Total:</span>

            {isLoading && (
                <h1 className="text-gray-400 text-5xl">...</h1>
            )}

            {isError && (
                <h1 className="text-red-500 text-5xl">0</h1>
            )}

            {!isLoading && !isError && (
                <h1 className="flex justify-end text-blue-500 text-5xl">
                    {issuedTotal}
                </h1>
            )}
        </div>
    );
}
