"use server";

import { fetchImportPrice } from "@/app/functions/admin/price/price";
import { NextResponse } from "next/server";

export async function GET(){
    try{
        const importprice = await fetchImportPrice();
        return NextResponse.json(importprice);
    }catch(error){
        return NextResponse.json(error);
    }
}