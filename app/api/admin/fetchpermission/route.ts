"use client";

import { fetchPermission } from "@/app/functions/admin/permission/permission";
import { NextResponse } from "next/server";

export async function GET(){
    try{
        const permission = await fetchPermission();
        return NextResponse.json(permission);
    }catch(error){
        console.error("Failed to fetch permission data!");
        throw new Error("Error fetching!");
    }
}