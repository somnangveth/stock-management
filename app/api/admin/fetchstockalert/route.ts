"use server";

import { fetchStockAlert } from "@/app/functions/admin/stock/stockalert/stockalert";
import { NextResponse } from "next/server";

export async function GET(){
    try{
        const stockAlert = await fetchStockAlert();
        return NextResponse.json(stockAlert);
    }catch(error){
        return NextResponse.json(error);
    }
}