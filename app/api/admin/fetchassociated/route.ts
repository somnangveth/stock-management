"use server";

import { fetchAssociation } from "@/app/functions/admin/stock/assocation/association";
import { NextResponse } from "next/server";

export async function GET(){
    try{
        const result = await fetchAssociation();

        return NextResponse.json(result);
    }catch(error){
        console.error("Failed to fetch datas", error);
        return NextResponse.json({error});
}
}