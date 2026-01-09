"use server";

import { fetchBatch } from "@/app/functions/admin/stock/product_batches/productbatches";
import { NextResponse } from "next/server";

export async function GET(){
    try{
        const batch = await fetchBatch();
        return NextResponse.json(batch);
    }catch(error){
        console.error("Failed to fetch batch data", error);
        return NextResponse.json(error);
    }
}