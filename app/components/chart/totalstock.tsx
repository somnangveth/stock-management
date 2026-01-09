"use client";

import { fetchProducts } from "@/app/functions/admin/api/controller";
import { Product } from "@/type/producttype";
import { useQuery } from "@tanstack/react-query";

export default function TotalStockPanel(){
    
    const {data: productData, isLoading: productLoading, error: productError} = useQuery<Product[]>({
        queryKey: ["total-stocks"],
        queryFn: fetchProducts,
    });

    const getTotalProduct = () => {
        if(productData?.length === 0){
            return 0;
        }else{
            return Number(productData?.length);
        }
    }
    return(
        <div className="w-full h-30 border rounded p-3">
            <span className="font-bold text-xl">Total:</span>
            <h1 className="text-amber-700 text-5xl flex justify-end">{String(getTotalProduct())}</h1>
        </div>
    )
}