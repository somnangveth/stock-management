"use server";

import { fetchContacts } from "@/app/admin/user/actions";
import { NextResponse } from "next/server";

export async function GET(){
    try{
    const contact = await fetchContacts();
    return NextResponse.json(contact);
    }catch(error: any){
        throw new Error("Failed to fetch contact data: ", error);
        NextResponse.json(error);
    }
}