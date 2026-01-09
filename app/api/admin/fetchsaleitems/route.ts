"use server";

import { fetchSaleItems } from "@/app/functions/admin/sale/sale";
import { NextResponse } from "next/server";


export async function GET(){
    try{
        const saleItem = await fetchSaleItems();
        return NextResponse.json(saleItem);
    }catch(error){
        return NextResponse.json(error);
    }
}