"use server";

import { fetchVendorProduct } from "@/app/functions/admin/stock/product/product";
import { NextResponse } from "next/server";

export async function GET(){
    try{
        const productvendor = await fetchVendorProduct();
        return NextResponse.json(productvendor);
    }catch(error){
        return NextResponse.json(error);
    }
}