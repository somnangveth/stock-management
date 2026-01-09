"use server";
import { getExpiredBatches } from "@/app/functions/admin/stock/expiry/expiry";
import { NextResponse } from "next/server";

export async function GET(){
    try{
        const expiry = await getExpiredBatches();
        return NextResponse.json(expiry);
    }catch(error){
        console.error("Failed to fetch expired batches", error);
        return NextResponse.json(error);
    }
}