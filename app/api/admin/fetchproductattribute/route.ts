"use server";

import { fetchProductAttribute } from "@/app/functions/admin/stock/product/attributes";
import { NextResponse } from "next/server";

export async function GET(){
    try{
        const productAttribute = await fetchProductAttribute();
        return NextResponse.json(productAttribute);
    }catch(error){
        return NextResponse.json(error);
    }
}