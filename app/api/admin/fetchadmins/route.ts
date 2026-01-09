"use server";

import { fetchAdmins } from "@/app/admin/user/actions";
import { NextResponse } from "next/server";

export async function GET(){
    try{
        const admins = await fetchAdmins();
        return NextResponse.json(admins);
    }catch(error){
        return NextResponse.json(error);
    }
    
}