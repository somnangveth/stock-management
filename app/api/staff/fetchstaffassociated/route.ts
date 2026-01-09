"use server";

import { checkPermission } from "@/lib/permission/checkpermission";
import { createSupabaseServerClient } from "@/lib/supbase/action";
import { NextResponse } from "next/server";

export async function GET(){
    try{
        console.log("API Route checking permission...");

        const hasPermission = await checkPermission('association.view');
        console.log("API Permission Result: ", hasPermission);

        if(!hasPermission){
            console.error("Permission Denied Returing 403");
            return NextResponse.json(
                {error: "Unauthorized: Missing association.view"},
                {status: 403}
            )
        }

        console.log("Permission Granted, fetching associated products...");
        const supabase = await createSupabaseServerClient();

        const {data, error} = await supabase
        .from('product_associations')
        .select("*")
        .order("association_id", {ascending: true});

        console.log("Products Association Query Result: ", 
            {
                error: error?.message,
                count: data?.length,
            }
        );

        if(error){
            console.error("Database error: ", error);
            return NextResponse.json({error: error.message}, {status: 500});
        };

        console.log("Returning product associations successfully...")
        return NextResponse.json({data, error:null});

    }catch(error){
        console.error("API Route Error: ", error);
        return NextResponse.json({error: error}, {status: 500});
    }
}