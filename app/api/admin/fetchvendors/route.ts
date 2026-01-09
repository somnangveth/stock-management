import { fetchVendors } from "@/app/admin/vendors/actions/vendor";
import { NextResponse } from "next/server";

export async function GET(){
    try{
    const vendor = await fetchVendors();
    return NextResponse.json(vendor);
    }catch(error){
        console.error("Failed to fetch vendor data", error);
        NextResponse.json({error: "Failed to fetch vendor datas"});
    }
}