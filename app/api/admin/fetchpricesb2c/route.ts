"use server";
import { fetchPricesB2C } from "@/app/functions/admin/price/price";
import { NextResponse } from "next/server";

export async function GET(){
    try{
        const price = await fetchPricesB2C();
        return NextResponse.json(price);
    }catch(error){
        return NextResponse.json(error);
    }
}