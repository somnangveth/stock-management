"use server";

import { checkPermission } from "@/lib/permission/checkpermission";
import { createSupabaseServerClient } from "@/lib/supbase/action";
import { NextResponse } from "next/server";

export async function GET(){
    try{
        console.log("API route checking: Route Checking Permission...");

        const hasPermission = await checkPermission('subcategory.view');
        console.log("API Permission Result: ", hasPermission);

        if(!hasPermission){
            console.log("Permission Denied Returning 403");
            return NextResponse.json(
                {error: "Unauthorized: Missing subcategory.view permission"},
                {status: 403}
            );
        }

        console.log("Permission Granted. Fetching subcategory...");

        const supabase = await createSupabaseServerClient();

        const {data, error} = await supabase
        .from("subcategory")
        .select("*")
        .order("subcategory_id", {ascending: true});

        console.log("Subcategory Query Result: ",
            {
                error: error?.message,
                count: data?.length,
            }
        );

        if(error){
            console.error("Database error: ", error);
            return NextResponse.json({error: error.message}, {status: 500})
        }

        console.log("Returing subcategory successfully")
        return NextResponse.json({data, error: null});

    }catch(error){
        console.error("API Route Error", error);
        return NextResponse.json({error: error}, {status: 500});
    }
}