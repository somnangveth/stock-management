import { fetchProducts } from "@/app/functions/admin/stock/product/product";
import { NextResponse } from "next/server";


export async function GET(){
    try{
    const product = await fetchProducts();
    return NextResponse.json(product);
    }catch(error: any){
        console.error("Failed to fetch Products data", error);
        return NextResponse.json({error: error.message});
    }
}