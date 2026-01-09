"use server";

import { fetchDiscounts } from "@/app/functions/admin/price/discount";
import { NextResponse } from "next/server";

export async function GET(){
    try{
        const discount = await fetchDiscounts();
        return NextResponse.json(discount);
    }catch(error){
        return NextResponse.json(error);
    }
}