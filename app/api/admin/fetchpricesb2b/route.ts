"use server";

import { fetchPricesB2B } from "@/app/functions/admin/price/price";
import { NextResponse } from "next/server";

export async function GET(){
    try{
        const price = await fetchPricesB2B();
        return NextResponse.json(price);
    }catch(error){
        console.error("Failed to fetch price data!");
        throw new Error("Error fetching!");
    }
}