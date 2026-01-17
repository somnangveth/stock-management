"use server";

import { fetchSalePrice } from "@/app/functions/admin/price/price";
import { NextResponse } from "next/server";

export async function GET(){
    try{
        const saleprice = await fetchSalePrice();
        return NextResponse.json(saleprice);
    }catch(error){
        return NextResponse.json(error);
    }
}