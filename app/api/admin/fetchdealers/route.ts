"use server";

import { fetchDealers } from "@/app/functions/admin/sale/dealer";
import { NextResponse } from "next/server";

export async function GET(){
    try{
        const dealer = await fetchDealers();
        return NextResponse.json(dealer);
    }catch(error){
        return NextResponse.json(error);
    }
}