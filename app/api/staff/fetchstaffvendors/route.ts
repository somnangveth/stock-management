"use server";

import { checkPermission } from "@/lib/permission/checkpermission";
import { createSupabaseServerClient } from "@/lib/supbase/action";
import { NextResponse } from "next/server";

export async function GET(){
    try{

        //Check API Route Permission
        console.log("API Route Checking Permission...");

        const hasPermission = await checkPermission('vendor.view');
        console.log('API query permission result: ', hasPermission);

        if(!hasPermission){
            console.error("Permission Denied Returning 403");
            return NextResponse.json(
                {error: "Unauthorized: Missing vendor.view permission"},
                {status: 403},
            )
        };

        console.log("Permission Granted...");

        //Fetching Vendors data
        const supabase = await createSupabaseServerClient();
        const {data, error} = await supabase
        .from("vendors")
        .select("*")
        .order("vendor_id", {ascending: true});

        console.log("Data Query Result: ",
            {
                error: error?.message,
                count: data?.length,
            }
        )

        if(error){
            console.error("Error fetching vendor data", error);
            return NextResponse.json(
                {error: error.message},
                {status: 500}
            )
        };

        console.log("Fetch vendor data successfully!");
        return NextResponse.json({
            data,
            error: null
        })
    }catch(error){
        console.error("API Route error", error);
        return NextResponse.json({error: error}, {status: 500});
    }
}