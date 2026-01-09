"use client";

import { Product } from "@/type/producttype";
import { useQuery } from "@tanstack/react-query";

export default function IssuedStockPanel(){
    

    return(
        <div className="w-full h-30 border rounded p-3">
            <span className="font-bold text-xl">Issued Total:</span>
            <h1 className="text-blue-500 text-5xl"></h1>
        </div>
    )
}