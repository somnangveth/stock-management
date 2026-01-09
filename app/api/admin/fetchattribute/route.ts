"use server";

import { fetchAttributes } from "@/app/functions/admin/stock/product/attributes";
import { NextResponse } from "next/server";

export async function GET(){
    try{
        const attribute = await fetchAttributes();
        return NextResponse.json(attribute);
    }catch(error){
        return NextResponse.json(error);
    }
}